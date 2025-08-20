<template>
  <v-container>
    <v-row justify="center">
      <v-col cols="12" sm="4" md="6">
        <v-card>
          <v-card-title class="text-h5 text-center">로그인</v-card-title>
          <v-card-text>
          <v-form @submit.prevent="doLogin">
            <v-text-field
              label="이메일"
              v-model="email"
              type="email"
              required
            >
            </v-text-field>
            <v-text-field
              label="비밀번호"
              v-model="password"
              type="password"
              required
            >
            </v-text-field>
            <v-btn type = "submit" color="primary" block>로그인</v-btn>
          </v-form>
          <br>
          <v-row>
            <v-col cols="4" class="d-flex justify-center">
              <img 
                src="@/assets/google_login.png"
                style="max-height: 40px; width: auto;"
                @click="googleLogin()"
              />
            </v-col>
            <v-col cols="4" class="d-flex justify-center">
              <img 
                src="@/assets/kakao_login.png"
                style="max-height: 40px; width: auto;"
                @click="kakaoLogin()"
              />
            </v-col>
            <v-col cols="4" class="d-flex justify-center">
              <img 
                src="@/assets/naver_login.png"
                style="max-height: 40px; width: auto;"
                @click="naverLogin()"
              />
            </v-col>
          </v-row>
        </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>
<script>
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
export default{
  data(){
    return{
      email: "",
      password: "",
      googleUrl: "https://accounts.google.com/o/oauth2/auth",
      googleClientId:"374485739574-jumcdbdoujbiibr15dhncieme5t1n3vb.apps.googleusercontent.com",
      googleRedirectUrl: "http://localhost:3000/oauth/google/redirect",
      googleScope: "openid email profile",
      kakaoUrl: "https://kauth.kakao.com/oauth/authorize",
      kakaoClientId:"1db026f5c4d2e11d7e597cdd4488d193",
      kakaoRedirectUrl: "http://localhost:3000/oauth/kakao/redirect",
      naverUrl: "https://nid.naver.com/oauth2.0/authorize",
      naverClientId:"GbQ_01jKVCMgOVze1pio",
      naverRedirectUrl: "http://localhost:3000/oauth/naver/redirect",
    }
  },
  methods:{
    async doLogin(){
      const loginData = {
        email:this.email,
        password:this.password
      };
<<<<<<< HEAD
      const response = await axios.post(`${process.env.VUE_APP_API_BASE_URL}/member/doLogin`, loginData);
      const token = response.data.result.accessToken;
      const role = jwtDecode(token).role;
      const email = jwtDecode(token).sub;
      localStorage.setItem("token", token);
      localStorage.setItem("role", role);
      localStorage.setItem("email", email);
      window.location.href="/";
=======
      try{
        const response = await axios.post(`${process.env.VUE_APP_API_BASE_URL}/member/doLogin`, loginData);
        console.log('response:', response);
        console.log('response.data:', response.data);
        // response에서 데이터 꺼낼 때 계층구조 제대로 확인 부탁드리겠습니다!
        const token = response.data.result.accessToken;
        const role = jwtDecode(token).role;
        const email = jwtDecode(token).sub;
        localStorage.setItem("token", token);
        localStorage.setItem("role", role);
        localStorage.setItem("email", email);
        window.location.href="/";
      }catch(e){
        console.log(e);
      }
    },
    
    googleLogin(){
      const auth_uri= `${this.googleUrl}?client_id=${this.googleClientId}&redirect_uri=${this.googleRedirectUrl}&response_type=code&scope=${this.googleScope}`;
      window.location.href = auth_uri;
    },

    kakaoLogin(){
      const auth_uri= `${this.kakaoUrl}?client_id=${this.kakaoClientId}&redirect_uri=${this.kakaoRedirectUrl}&response_type=code`;
      window.location.href = auth_uri;
    },

    naverLogin(){
      const auth_uri= `${this.naverUrl}?client_id=${this.naverClientId}&redirect_uri=${this.naverRedirectUrl}&response_type=code`;
      window.location.href = auth_uri;
>>>>>>> develop
    }
  }
}
</script>