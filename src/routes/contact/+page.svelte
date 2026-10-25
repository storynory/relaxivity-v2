<script lang="ts">
  // Demo only: native browser validation, no submission or email delivery.
  let tested = $state(false);

  function tryForm(event: SubmitEvent) {
    event.preventDefault();
    tested = true;
  }
</script>

<svelte:head>
  <title>Contact</title>
  <meta name="description" content="Get in touch with us." />
</svelte:head>

<main class="container-narrow">
  <h1>Get in touch</h1>
  <p>Have a question or an idea? Send us a message.</p>

  <!-- For a real site, replace onsubmit with a site-specific form action and method="POST". -->
  <form onsubmit={tryForm}>
    <div>
      <label for="contact-name">Name</label>
      <input class="form-control" id="contact-name" name="name" autocomplete="name" required />
    </div>
    <div>
      <label for="contact-email">Email</label>
      <input class="form-control" id="contact-email" name="email" type="email" autocomplete="email" required />
    </div>
    <div>
      <label for="contact-message">Message</label>
      <textarea class="form-control" id="contact-message" name="message" rows="6" required></textarea>
    </div>
    <button class="button" type="submit">Test form</button>
    {#if tested}
      <p role="status">The form passes browser validation. This is a demo: no message was sent.</p>
    {/if}
  </form>
  <p class="note">Demo only — no email is sent. Connect a provider when adapting Starter for a real site.</p>
</main>

<style>
  main { padding-block: calc(var(--space) * 2); }
  form { display: grid; gap: var(--space); max-width: 36rem; }
  form > div { display: grid; gap: 0.35rem; }
  button { justify-self: start; }
  .note { margin-top: var(--space); font-size: 0.9em; }
</style>
