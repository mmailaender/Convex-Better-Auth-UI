## Upgrade localhost to https

1. installing a local certificate authority with mkcert on my WSL | mkcert -install
2. creating a certificate in my project | mkdir cert && mkcert -key-file cert/key.pem -cert-file cert/cert.pem localhost

### On Windows:
3. installed the certificate also on windows side with certlm
3.1. Get the root certification location | mkcert -CAROOT
3.2. Open the tool Certmgr.exe (Certificate Manager Tool) on windows (if not available it needs to be first activated)
3.3. Go to Trusted Root Certification Authorities > Certificates
3.4. Scroll to the end of the list and right click on some white space > All taks > import and then import the rootCA.pem from the root certification location

## Init your project

`pnpm init:repo`
