import Vue from 'vue';
import VueRouter from 'vue-router'
import Vuex from 'vuex'

import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap';

import AppComponent from './components/app/app';
import Login from './components/login/login';


Vue.use(VueRouter)
Vue.use(Vuex)
const routes = [
  { path: '/', component: AppComponent, name: 'spy' },
  { path: '/login', component: Login, name: 'login' }
]
window.router = new VueRouter({
  mode: 'history',
  routes // short for routes: routes
})
const store = new Vuex.Store({
  state: {
    ssms: {},
    wanted: [],
    types: []
  },
  mutations: {
    set_ssms(state, data) {
      // console.log(data);
      state.ssms = data;
      state.types = [];
      state.wanted = Object.values(state.ssms);
      state.wanted.forEach((s) => {
        state.types.find(t => t.name == s.type)
          || state.types.push({ name: s.type, active: false });
      })
      state.types.push({ name: 'all', active: true });
    },
    set_ssm(state, data) {
      // Vue.set(state.ssms, data.ssm_hash, data);
      state.ssms[data.id] = data.value;
    },
    set_ssm_value(state, data) {
      // console.log(data.id, data.id2, data.value);
      // console.log(state.ssms[data.id][data.id2]);
      // state.ssms[data.id][data.id2] = data.value;
      Vue.set(state.ssms[data.id], data.id2, data.value);
    }
  }
})
window.test = (id, id2, value) => {
  store.commit('set_ssm_value', {
    id: id,
    id2: id2,
    value: value
  });
}

const app = new Vue({
  store,
  router
}).$mount('#app')