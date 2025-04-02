import { g as getVerificationEmail, s as send } from "../../../../../../chunks/index3.js";
const POST = async (event) => {
  const { OTP, emailTo } = await event.request.json();
  const { html } = await getVerificationEmail(OTP);
  const { data, error } = await send({
    from: "verifications@etesie.dev",
    to: emailTo,
    subject: `${OTP} is your verification code`,
    html
  });
  if (error) {
    return new Response(error.message, { status: 400 });
  }
  return new Response(JSON.stringify(data));
};
export {
  POST
};
