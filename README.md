HashTalk NEXT
=============

This branch is the future of HashTalk. It's the same service, powered by the same technology (Angular + Firebase), but now without a server and with a more mobile-centric interface.

## What is new ?
First, the interface. There is no major change in the already-working UI, but Bootstrap has been replaced by Ratchet. The service is now designed with mobile in mind for an integration with Cordova.

Also, the central NodeJS server has been removed. The entire message verification process is done in Firebase security rule, which makes it a lot faster.

I completely recoded the JS to make it even more efficient and to make full use of Angular.