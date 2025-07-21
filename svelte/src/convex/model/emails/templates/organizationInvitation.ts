/**
 * Email template for organization invitations
 */

/**
 * Interface for organization invitation email parameters
 */
export interface OrganizationInvitationParams {
	organizationName: string;
	inviterName: string;
	acceptUrl: string;
}

/**
 * Generates HTML for organization invitation email
 * @param params - Parameters for the invitation email
 * @returns HTML string for the organization invitation email
 */
export function generateOrganizationInvitationEmail(params: OrganizationInvitationParams): string {
	const { organizationName, inviterName, acceptUrl } = params;

	const appName = process.env.APP_NAME;

	return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
    <html dir="ltr" lang="en">
      <head>
        <link
          rel="preload"
          as="image"
          href="https://new.email/static/app/placeholder.png" />
        <meta content="text/html; charset=UTF-8" http-equiv="Content-Type" />
        <meta name="x-apple-disable-message-reformatting" />
      </head>
      <body
        style='background-color:rgb(243,244,246);font-family:ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";padding-top:40px;padding-bottom:40px'>
        <!--$-->
        <div
          style="display:none;overflow:hidden;line-height:1px;opacity:0;max-height:0;max-width:0">
          You&#x27;ve been invited to join ${organizationName}.
          <div>
             ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿
          </div>
        </div>
        <table
          align="center"
          width="100%"
          border="0"
          cellpadding="0"
          cellspacing="0"
          role="presentation"
          style="background-color:rgb(255,255,255);border-radius:8px;margin-left:auto;margin-right:auto;padding:20px;max-width:600px">
          <tbody>
            <tr style="width:100%">
              <td>
                <h1
                  style="font-size:24px;font-weight:700;color:rgb(31,41,55);margin-top:32px;margin-bottom:16px">
                  You&#x27;ve been invited to
                  <!-- -->${organizationName}
                </h1>
                <p
                  style="font-size:16px;color:rgb(75,85,99);margin-bottom:24px;line-height:24px;margin-top:16px">
                  Hello there,
                </p>
                <p
                  style="font-size:16px;color:rgb(75,85,99);margin-bottom:24px;line-height:24px;margin-top:16px">
                  <strong>${inviterName}</strong> has invited you to join their
                  organization on
                  <!-- -->${appName}<!-- -->. Join now to start collaborating with
                  the team.
                </p>
                <table
                  align="center"
                  width="100%"
                  border="0"
                  cellpadding="0"
                  cellspacing="0"
                  role="presentation"
                  style="text-align:center;margin-top:32px;margin-bottom:32px">
                  <tbody>
                    <tr>
                      <td>
                        <a
                          href="${acceptUrl}"
                          style="background-color:rgb(37,99,235);color:rgb(255,255,255);font-weight:700;padding-top:12px;padding-bottom:12px;padding-left:20px;padding-right:20px;border-radius:4px;text-decoration-line:none;text-align:center;box-sizing:border-box;line-height:100%;text-decoration:none;display:inline-block;max-width:100%;mso-padding-alt:0px;padding:12px 20px 12px 20px"
                          target="_blank"
                          ><span
                            ><!--[if mso]><i style="mso-font-width:500%;mso-text-raise:18" hidden>&#8202;&#8202;</i><![endif]--></span
                          ><span
                            style="max-width:100%;display:inline-block;line-height:120%;mso-padding-alt:0px;mso-text-raise:9px"
                            >Accept Invitation</span
                          ><span
                            ><!--[if mso]><i style="mso-font-width:500%" hidden>&#8202;&#8202;&#8203;</i><![endif]--></span
                          ></a
                        >
                      </td>
                    </tr>
                  </tbody>
                </table>
                <p
                  style="font-size:14px;color:rgb(75,85,99);margin-bottom:24px;line-height:24px;margin-top:16px">
                  If you&#x27;re having trouble with the button above, copy and
                  paste the URL below into your web browser:
                </p>
                <p
                  style="font-size:14px;color:rgb(37,99,235);margin-bottom:32px;word-break:break-all;line-height:24px;margin-top:16px">
                  <a
                    href="${acceptUrl}"
                    style="color:rgb(37,99,235);text-decoration-line:none"
                    target="_blank"
                    >${acceptUrl}</a
                  >
                </p>
                <p
                  style="font-size:14px;color:rgb(75,85,99);margin-bottom:24px;line-height:24px;margin-top:16px">
                  If you did not expect this invitation, you can ignore this email.
                </p>
              </td>
            </tr>
          </tbody>
        </table>
        <!--7--><!--/$-->
      </body>
    </html>  
    `;
}
