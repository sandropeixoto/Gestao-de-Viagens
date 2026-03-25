import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const url = new URL(req.url)
        const sso_payload = url.searchParams.get('sso_payload')
        const sso_sig = url.searchParams.get('sso_sig')

        if (!sso_payload || !sso_sig) {
            return new Response(JSON.stringify({ error: "Missing SSO parameters" }), {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            })
        }

        const secret = Deno.env.get('SSO_SECRET_KEY') || 'GestorGov_Secure_Integration_Token_2026!'
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

        // 1. Validate Signature (HMAC-SHA256)
        const encoder = new TextEncoder()
        const keyData = encoder.encode(secret)
        const key = await crypto.subtle.importKey(
            "raw",
            keyData,
            { name: "HMAC", hash: "SHA-256" },
            false,
            ["verify"]
        )

        // Convert hex signature to Uint8Array
        const sigBuffer = new Uint8Array(sso_sig.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)))

        const isValid = await crypto.subtle.verify(
            "HMAC",
            key,
            sigBuffer,
            encoder.encode(sso_payload)
        )

        if (!isValid) {
            return new Response(JSON.stringify({ error: "Invalid signature" }), {
                status: 403,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            })
        }

        // 2. Decode and Validate Payload
        const payloadJson = JSON.parse(atob(sso_payload))
        const { user_id, user_name, user_email, user_level, exp } = payloadJson

        if (Date.now() / 1000 > exp) {
            return new Response(JSON.stringify({ error: "Token expired" }), {
                status: 403,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            })
        }

        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        })

        // 3. Just-in-Time Provisioning
        // Get user by email
        const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers()
        if (listError) throw listError

        let user = users.find(u => u.email === user_email)

        if (!user) {
            // Create user
            const { data: { user: newUser }, error: createError } = await supabaseAdmin.auth.admin.createUser({
                email: user_email,
                email_confirm: true,
                user_metadata: { full_name: user_name },
                password: crypto.randomUUID() // Random password
            })
            if (createError) throw createError
            user = newUser
        }

        if (!user) throw new Error("Failed to provision user")

        // 4. Update Profile
        // Map user_level to cargo if needed, or store as nivel_acesso
        await supabaseAdmin.from('profiles').upsert({
            id: user.id,
            nome: user_name,
            gestorgov_id: user_id,
            nivel_acesso: user_level,
            // Fallback fields if it's a new profile
            cargo: user_level === 1 ? 'DAD' : 'Operador', 
            departamento: 'GestorGov'
        }, { onConflict: 'id' })

        // 5. Generate Magic Link for frictionless login
        // type: 'magiclink' generates a link that logs the user in directly
        const { data: { properties }, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
            type: 'magiclink',
            email: user_email,
            options: {
                redirectTo: `${url.origin}/dashboard` // Or where you want them to go
            }
        })

        if (linkError) throw linkError

        return new Response(
            JSON.stringify({
                status: "authenticated",
                login_url: properties.action_link
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        )

    } catch (error: any) {
        console.error("SSO Error:", error)
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        })
    }
})
