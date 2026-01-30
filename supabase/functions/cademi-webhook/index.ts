
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// @ts-ignore
Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const {
            token,
            productId,
            productName,
            clientName,
            clientEmail,
            submissionId,
            status
        } = await req.json()

        // Endpoint padrão da Cademí para postback
        const cademiUrl = "https://membros.cademi.com.br/api/postback"

        // Montar os dados conforme solicitado: codigo,status,produto_id,produto_nome,cliente_nome,cliente_email
        // Usamos o submissionId como código único da transação
        const transactionCode = `${submissionId}-${Date.now()}`

        const body = new URLSearchParams()
        body.append('token', token)
        body.append('codigo', transactionCode)
        body.append('status', status || 'aprovado')
        body.append('produto_id', productId)
        body.append('produto_nome', productName)
        body.append('cliente_nome', clientName)
        body.append('cliente_email', clientEmail)
        body.append('email', clientEmail)

        const bodyString = body.toString()
        console.log(`[Cademi] Enviando postback para ${clientEmail} - Produto: ${productId} - Codigo: ${transactionCode}`)

        const response = await fetch(cademiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: bodyString
        })

        const result = await response.text()
        console.log('[Cademi] Resposta:', result)

        return new Response(JSON.stringify({
            success: response.ok,
            status: response.status,
            cademi: result
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        console.error('[Cademi] Erro:', errorMessage)
        return new Response(JSON.stringify({ error: errorMessage }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
