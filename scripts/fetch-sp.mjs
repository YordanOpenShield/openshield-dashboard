const res = await fetch("http://localhost:3000/api/auth/sso/saml2/sp/metadata?providerId=openshield-saml");
const text = await res.text();
console.log(text);
