# Contact form example

Starter's `/contact/` page is a **design and browser-validation demo**. It does not send messages. The form uses reusable `.form-control` and `.button` classes, plus a few scoped layout rules.

## Connect a form for your own website

Pick a form service or server endpoint for that website. For a hosted HTML form service such as Formspree:

1. Open `src/routes/contact/+page.svelte`.
2. Remove the demo `<script>` block and its `onsubmit={tryForm}` handler.
3. Change the opening tag to:

   ```svelte
   <form action="https://formspree.io/f/YOUR_SITE_FORM_ID" method="POST">
   ```

4. Change the button text to **Send message**.
5. Remove the `{#if tested}...{/if}` status block and the demo-only note.
6. Test submission and spam handling on the actual site.

The existing fields already have `name` attributes, accessible labels, and native `required` and email validation. For another provider, follow its instructions for the form `action`, method, and any additional fields.

**Privacy:** never ship a real personal endpoint as Starter's default. Each deployed website must configure its own recipient. Keep secret API keys out of browser code. If using a private email API, use a server-side endpoint instead.
