import Vue from 'vue';
import template from './login.html';
import css from './login.css';

const Login = Vue.extend({
    template,
    data() {

        return {
            credentials: {
                username: '',
                password: ''
            },
            error: ''
        }
    },
    methods: {
        login() {
            if(!this.credentials.username || !this.credentials.password) {
                alert('用户名或密码不能为空');
                return;
            }
            let ld = {
                username:this.credentials.username,
                password:this.credentials.password
            }
            $.ajax({
                type: "post",
                url: '/login',
                timeout: 2000,
                dataType: 'json',
                data: ld,
                success: (data) => {
                    // console.log(data);
                    if (data.ret == 0) {
                        sessionStorage.setItem('token_id', data.token_id)
                        this.$router.replace({ name: 'spy' })
                    }
                    else {
                        this.error = '无效的用户名或密码';
                    }
                },
                error: (XMLHttpRequest, textStatus, errorThrown) => {
                    console.log(XMLHttpRequest, textStatus, errorThrown);
                    this.error = textStatus;

                }
            })
        }
    }
});

export default Login;