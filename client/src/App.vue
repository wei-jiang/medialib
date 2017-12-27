<template>
  <v-app light>    
    <router-view/>
    <v-footer :fixed="fixed" app>
      <span>&copy; 2017</span>
    </v-footer>
  </v-app>
</template>

<script>
export default {
  name: 'app'
}
</script>

<style>
  html, body{
    margin: 0px;
    padding: 0px;
    overflow: hidden;
  }
</style>
