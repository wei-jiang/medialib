import Vue from 'vue'
import Router from 'vue-router'
import AdsMgr from '@/components/AdsMgr'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'AdsMgr',
      component: AdsMgr
    }
  ]
})
