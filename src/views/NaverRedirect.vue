<template>
    <div>네이버 로그인 진행중...</div>
</template>

<script>
import axios from 'axios';

    export default{
        created(){
            console.log("created 호출");
            const code = new URL(window.location.href).searchParams.get("code");
            console.log("code : ", code);
            this.sendCodeToServer(code);
        },
        methods:{
            async sendCodeToServer(code){
                console.log("sendCodeToServer 호출");
                const response = await axios.post(`${process.env.VUE_APP_API_BASE_URL}/member/naver/doLogin`, {code});
                const token = response.data.result.token;
                localStorage.setItem("token", token);
                window.location.href = "/";
            }
        }
    }
</script>