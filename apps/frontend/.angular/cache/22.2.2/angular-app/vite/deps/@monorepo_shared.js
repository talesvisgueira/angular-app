//#region ../../packages/shared/dist/auth.js
function isLoginRequest(value) {
	if (typeof value !== "object" || value === null) return false;
	const { email, password } = value;
	return typeof email === "string" && email.includes("@") && typeof password === "string" && password.length >= 6;
}
function isNonEmptyString(value) {
	return typeof value === "string" && value.trim().length > 0;
}
function isValidEmail(value) {
	return typeof value === "string" && value.includes("@");
}
/**
* Valida o corpo do cadastro inicial: nome e email da organização e nome, email
* e username do administrador são obrigatórios, e a senha tem no mínimo 6
* caracteres — mesma regra de senha de `isLoginRequest`.
*/
function isSetupRequest(value) {
	if (typeof value !== "object" || value === null) return false;
	const { organization, admin } = value;
	if (typeof organization !== "object" || organization === null) return false;
	if (typeof admin !== "object" || admin === null) return false;
	const org = organization;
	const adm = admin;
	return isNonEmptyString(org.name) && isValidEmail(org.email) && isNonEmptyString(adm.name) && isValidEmail(adm.email) && isNonEmptyString(adm.username) && typeof adm.password === "string" && adm.password.length >= 6;
}
function base64UrlDecode(segment) {
	const base64 = segment.replace(/-/g, "+").replace(/_/g, "/");
	const padded = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, "=");
	const binary = atob(padded);
	const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
	return new TextDecoder().decode(bytes);
}
/**
* Decodifica o payload de um JWT SEM verificar a assinatura — a verificação
* criptográfica é responsabilidade do backend (`POST /api/auth/validate`).
* Retorna null quando o token não tem a estrutura de 3 segmentos ou o payload
* não contém os claims mínimos esperados.
*/
function parseJwt(token) {
	if (typeof token !== "string") return null;
	const segments = token.split(".");
	if (segments.length !== 3) return null;
	const [, payloadSegment] = segments;
	if (!payloadSegment) return null;
	try {
		const parsed = JSON.parse(base64UrlDecode(payloadSegment));
		if (typeof parsed !== "object" || parsed === null) return null;
		const { sub, email, name, profiles, exp } = parsed;
		return typeof sub === "string" && typeof email === "string" && typeof name === "string" && Array.isArray(profiles) && profiles.every((profile) => typeof profile === "string") && typeof exp === "number" ? parsed : null;
	} catch {
		return null;
	}
}
/** Indica se os claims já expiraram (`exp` em segundos desde o epoch). */
function isTokenExpired(claims, now = Date.now()) {
	return claims.exp * 1e3 <= now;
}
//#endregion
export { isLoginRequest, isSetupRequest, isTokenExpired, parseJwt };
