# **App Name**: QuickNote

## Core Features:

- Note Creation and Link Generation: Allow users to type a note, encrypt it client-side, and generate a short, unique link for sharing using nanoid.
- Optional Settings: Implement settings for password protection (client-side encryption using AES with CryptoJS or WebCrypto API) and expiration rules (time-based or view-based).
- Note Access and Decryption: Prompt for a password if the note is password protected. Decrypt the note client-side after successful authentication. Show the note content. Display an 'expired or deleted' message if the note is unavailable.
- Automatic Note Deletion: Implement API routes and a cleanup routine to automatically delete expired notes or notes that have reached their view limit.
- PWA Installation Support: Enable PWA installation by adding a manifest file, service worker and icons.
- Link Generation and Display: After creating a note, display the generated short link with a 'Copy' button and QR code using existing libraries.
- Note Tool: If the note has settings applied to it such as expiration date or views then incorporate a deletion event tool.

## Style Guidelines:

- Primary color: Bright blue (#00A9FF), as requested by the user, to signal trustworthiness and security in a tech context.
- Background color: Light blue (#E5F6FF), a very desaturated version of the primary, to provide a calm backdrop that supports long sessions of note-taking.
- Accent color: Turquoise (#00FF9F), an analogous color to the primary but of different brightness, for subtle highlighting.
- Font: 'Inter' (sans-serif) for body and headlines, which ensures a modern, clean, and readable UI. Note: currently only Google Fonts are supported.
- Mobile-first layout with a large textarea and big buttons. Desktop view should be centered with a max-width around 480px to emulate mobile.
- Implement a 'Create Link' button fixed at the bottom on mobile screens for easy access.
- Subtle transitions and animations using Framer Motion for a smooth user experience when creating and viewing notes.