<template>
  <footer class="bg-dark text-white text-center q-py-md footer-container">
    <div class="brand-container">
      {{ $t('footerWide.brandName') }}
      {{ $t('footerWide.copyright') }}
    </div>
    <div class="footer-columns-container">
      <div class="footer-column">
        <a href="/#/privacyPolicy"> {{ $t('footerWide.privacyPolicy.title') }} </a>
      </div>
      <div class="footer-column">
        <a href="/#/legalTerms"> {{ $t('footerWide.legalTerms.title') }} </a>
      </div>
      <div class="footer-column">
        <a href="/#/disclaimer"> {{ $t('footerWide.disclaimer.title') }} </a>
      </div>
      <div class="footer-column">
        <a href="/#/contactUs"> {{ $t('footerWide.contactUs') }} </a>
      </div>
    </div>




  </footer>
</template>

<style lang="scss"> .footer-container {
   display: flex;
   flex-direction: column;
 }

 .footer-columns-container {
   display: flex;
 }

 .footer-column {
   display: flex;
   justify-content: center;
   align-items: center;
   flex-grow: 1;
 }

 .brand-container {
   padding-bottom: 1rem;
 }
</style>
