module.exports = async (req, res) => {
  const clientId = process.env.OAUTH_CLIENT_ID;
  const clientSecret = process.env.OAUTH_CLIENT_SECRET;
  const urlObj = new URL(req.url, `https://${req.headers.host}`);
  const code = urlObj.searchParams.get('code');

  if (!clientId || !clientSecret) {
    res.statusCode = 500;
    res.end('Faltan OAUTH_CLIENT_ID / OAUTH_CLIENT_SECRET en Vercel (Settings > Environment Variables).');
    return;
  }
  if (!code) {
    res.statusCode = 400;
    res.end('Falta el parámetro "code" de GitHub.');
    return;
  }

  try {
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code }),
    });
    const tokenData = await tokenRes.json();

    if (!tokenData.access_token) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.end(`<p>Error autenticando con GitHub: ${JSON.stringify(tokenData)}</p>`);
      return;
    }

    const payload = JSON.stringify({ token: tokenData.access_token, provider: 'github' });
    const html = `<!DOCTYPE html><html><body>
<script>
(function() {
  function receiveMessage(e) {
    window.opener.postMessage(
      'authorization:github:success:${payload.replace(/'/g, "\\'")}',
      e.origin
    );
    window.removeEventListener("message", receiveMessage, false);
  }
  window.addEventListener("message", receiveMessage, false);
  window.opener.postMessage("authorizing:github", "*");
})();
</script>
</body></html>`;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end(html);
  } catch (err) {
    res.statusCode = 500;
    res.end('Error en el intercambio OAuth: ' + err.message);
  }
};
