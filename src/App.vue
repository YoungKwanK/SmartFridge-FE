<template>
  <v-app>
    <SidebarComponent/>
    <v-main>
      <router-view/>
    </v-main>
  </v-app>
</template>

<script>
import SidebarComponent from './components/common/SidebarComponent.vue'

export default {
  name: 'App',
  components: {
    SidebarComponent
  }
}
</script>

<style>
</style>
