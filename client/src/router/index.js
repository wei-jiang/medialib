import Vue from 'vue'
import Router from 'vue-router'
import AdsMgr from '@/components/AdsMgr'
import Login from '@/components/Login'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'AdsMgr',
      component: AdsMgr
    },
    {
      path: '/login',
      name: 'Login',
      component: Login
    }
  ]
})
