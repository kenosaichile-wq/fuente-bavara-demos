module.exports = (req, res) => {
  const clientId = process.env.OAUTH_CLIENT_ID;
  if (!clientId) {
    res.statusCode = 500;
    res.end('Falta configurar OAUTH_CLIENT_ID en Vercel (Settings > Environment Variables).');
    return;
  }
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const redirectUri = `${proto}://${req.headers.host}/api/callback`;
  const scope = 'repo,user';
  const url = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}`;
  res.writeHead(302, { Location: url });
  res.end();
};
