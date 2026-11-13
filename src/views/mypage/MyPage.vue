<template>
  <div class="mypage">
    <header class="page-head">
      <h1 class="sf-page-title">내 정보</h1>
    </header>

    <div class="mypage-grid">
      <!-- 프로필 -->
      <section class="panel profile" aria-label="프로필">
        <div class="avatar-wrap">
          <div v-if="!userInfo.profileImage" class="avatar avatar-initial" aria-hidden="true">{{ userInitial }}</div>
          <v-img v-else :src="userInfo.profileImage" alt="프로필 사진" class="avatar" width="88" height="88" cover />
          <button type="button" class="avatar-edit" aria-label="프로필 사진 바꾸기" @click="openImageUpload">
            <v-icon size="16">mdi-camera-outline</v-icon>
          </button>
          <input ref="imageInput" type="file" accept="image/*" class="d-none" @change="handleImageUpload" />
        </div>

        <div class="profile-body">
          <div v-if="!isEditingName" class="name-row">
            <h2 class="profile-name">{{ userInfo.name || '이름 없음' }}</h2>
            <v-btn icon="mdi-pencil-outline" size="small" variant="text" aria-label="이름 바꾸기" @click="toggleEditName" />
          </div>
          <div v-else class="name-edit">
            <v-text-field
              ref="nameInput"
              v-model="editedName"
              label="이름"
              variant="outlined"
              density="compact"
              hide-details
              autofocus
              @keyup.enter="saveName"
              @keyup.esc="cancelEditName"
            />
            <v-btn color="primary" variant="flat" size="small" @click="saveName">저장</v-btn>
            <v-btn variant="text" size="small" @click="cancelEditName">취소</v-btn>
          </div>

          <dl class="profile-facts">
            <div><dt>이메일</dt><dd>{{ userInfo.email || '없음' }}</dd></div>
            <div><dt>가입일</dt><dd>{{ formatDate(userInfo.createdTime) || '알 수 없음' }}</dd></div>
          </dl>

          <dl class="activity">
            <div><dt>작성한 글</dt><dd class="sf-num">{{ myStats.postCount || 0 }}</dd></div>
            <div><dt>작성한 댓글</dt><dd class="sf-num">{{ myStats.commentCount || 0 }}</dd></div>
            <div><dt>받은 좋아요</dt><dd class="sf-num">{{ myStats.likeCount || 0 }}</dd></div>
          </dl>
        </div>
      </section>

      <!-- 내가 쓴 글 -->
      <section class="panel posts" aria-labelledby="my-posts-title">
        <header class="panel-head">
          <h2 id="my-posts-title" class="sf-panel-title">내가 쓴 글</h2>
          <v-btn icon="mdi-refresh" size="small" variant="text" aria-label="새로 고침" @click="fetchMyPosts" />
        </header>

        <div v-if="isLoadingPosts" class="state-box">
          <v-progress-circular indeterminate color="primary" size="28" />
        </div>
        <ul v-else-if="myPosts.length > 0" class="post-list">
          <li v-for="post in myPosts" :key="post.id">
            <button type="button" class="post-row" @click="viewPost(post)">
              <span class="post-main">
                <span class="post-title">{{ post.title }}</span>
                <span class="post-meta">
                  <span>{{ post.categoryName }}</span>
                  <span v-if="post.fridgeName">{{ post.fridgeName }}</span>
                  <span>{{ post.timeAgo }}</span>
                </span>
              </span>
              <span class="post-counts sf-num">
                <span :aria-label="`조회 ${post.viewCount || 0}`"><v-icon size="15" aria-hidden="true">mdi-eye-outline</v-icon>{{ post.viewCount || 0 }}</span>
                <span :aria-label="`좋아요 ${post.likeCount || 0}`"><v-icon size="15" aria-hidden="true">mdi-heart-outline</v-icon>{{ post.likeCount || 0 }}</span>
                <span :aria-label="`댓글 ${post.commentCount || 0}`"><v-icon size="15" aria-hidden="true">mdi-comment-outline</v-icon>{{ post.commentCount || 0 }}</span>
              </span>
            </button>
          </li>
        </ul>
        <p v-else class="empty-text">아직 쓴 글이 없어요. 커뮤니티에서 첫 글을 남겨 보세요.</p>
      </section>

      <!-- 알림 설정 -->
      <section class="panel settings" aria-labelledby="settings-title">
        <header class="panel-head">
          <h2 id="settings-title" class="sf-panel-title">받을 알림</h2>
        </header>
        <ul class="setting-list">
          <li v-for="setting in notificationSettings" :key="setting.type" class="setting-row">
            <span class="setting-text">
              <span class="setting-title">{{ setting.title }}</span>
              <span class="setting-desc">{{ setting.description }}</span>
            </span>
            <v-switch
              v-model="setting.isActive"
              color="primary"
              hide-details
              inset
              density="compact"
              :aria-label="setting.title"
              @change="onNotificationSettingChange"
            />
          </li>
        </ul>
        <div v-if="hasNotificationChanges" class="settings-actions">
          <span class="changes-text">바꾼 설정은 저장해야 적용돼요.</span>
          <v-btn variant="text" :disabled="isSavingNotifications" @click="cancelNotificationChanges">되돌리기</v-btn>
          <v-btn color="primary" variant="flat" :loading="isSavingNotifications" @click="saveNotificationSettings">알림 설정 저장</v-btn>
        </div>
      </section>

      <!-- 계정 삭제는 맨 아래, 눈에 덜 띄게 -->
      <section class="danger" aria-labelledby="danger-title">
        <div>
          <h2 id="danger-title" class="danger-title">회원 탈퇴</h2>
          <p class="danger-desc">계정과 내가 쓴 글, 댓글, 냉장고 참여 정보가 모두 지워지고 되돌릴 수 없어요.</p>
        </div>
        <v-btn variant="outlined" color="error" @click="showDeleteAccountDialog = true">탈퇴하기</v-btn>
      </section>
    </div>

    <!-- 회원 탈퇴 확인 다이얼로그 -->
    <v-dialog v-model="showDeleteAccountDialog" max-width="440">
      <v-card class="pa-2">
        <v-card-title class="sf-dialog-title">정말 탈퇴할까요?</v-card-title>
        <v-card-text class="dialog-body">
          <p>탈퇴하면 아래 정보가 모두 지워지고 되돌릴 수 없어요.</p>
          <ul>
            <li>프로필과 계정 정보</li>
            <li>내가 쓴 글과 댓글</li>
            <li>참여 중인 냉장고 정보</li>
            <li>알림 설정과 활동 기록</li>
          </ul>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showDeleteAccountDialog = false">취소</v-btn>
          <v-btn color="error" variant="flat" :loading="isDeletingAccount" @click="deleteAccount">탈퇴하기</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import axios from 'axios'

export default {
  name: 'MyPage',
  data() {
    return {
      isEditingName: false,
      editedName: '',
      isLoadingPosts: false,
      myPosts: [],
      myStats: {
        postCount: 0,
        commentCount: 0,
        likeCount: 0
      },

      notificationSettings: [
        {
          type: 'SYSTEM',
          title: '시스템 알림',
          description: '시스템 공지사항 및 중요한 업데이트',
          isActive: true
        },
        {
          type: 'ANNOUNCE',
          title: '공지사항',
          description: '냉장고 관련 공지사항 및 안내',
          isActive: true
        },
        {
          type: 'COMMENT',
          title: '댓글 알림',
          description: '내 게시글에 댓글이 달렸을 때',
          isActive: true
        },
        {
          type: 'CHAT',
          title: '채팅 알림',
          description: '새로운 채팅 메시지가 도착했을 때',
          isActive: true
        }
      ],
      originalNotificationSettings: [], // 원본 설정을 저장하여 변경사항 추적
      hasNotificationChanges: false, // 변경사항 여부
      isSavingNotifications: false, // 저장 중 상태
      showDeleteAccountDialog: false, // 회원 탈퇴 다이얼로그 표시 여부
      isDeletingAccount: false // 회원 탈퇴 진행 중 상태
    }
  },
  computed: {
    ...mapGetters(['getUserInfo', 'getUserName', 'getUserProfileImage', 'getUserInitial']),
    userInfo() {
      return this.getUserInfo || {}
    },
    userInitial() {
      return this.getUserInitial || 'U'
    }
  },
  async created() {
    await this.loadUserData()
    await this.fetchMyPosts()
    await this.fetchMyStats()

    // 알림 설정은 에러가 발생해도 페이지 로딩을 방해하지 않도록 처리
    try {
      await this.fetchNotificationSettings()
    } catch (error) {
      console.warn('⚠️ 알림 설정 로드 실패, 기본값 사용:', error.message)
    }
  },
  methods: {
    async loadUserData() {
      try {
        await this.$store.dispatch('fetchUserInfo')
      } catch (error) {
        console.error('사용자 정보 로드 실패:', error)
      }
    },

    async fetchMyPosts() {
      try {
        this.isLoadingPosts = true
        const token = localStorage.getItem('accessToken')
        const response = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL}/member/myposts`,
          {
            headers: { 'Authorization': `Bearer ${token}` }
          }
        )
        
        // CommonDto 구조에 맞춰 응답 처리
        if (response.data.status_code === 200 && response.data.result) {
          this.myPosts = response.data.result || []
        } else {
          this.myPosts = []
        }
      } catch (error) {
        console.error('내 게시글 조회 실패:', error)
        this.myPosts = []
      } finally {
        this.isLoadingPosts = false
      }
    },

    async fetchMyStats() {
      try {
        const token = localStorage.getItem('accessToken')
        const response = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL}/member/mystats`,
          {
            headers: { 'Authorization': `Bearer ${token}` }
          }
        )
        
        // CommonDto 구조에 맞춰 응답 처리
        if (response.data.status_code === 200 && response.data.result) {
          this.myStats = response.data.result
        } else {
          this.myStats = {
            postCount: 0,
            commentCount: 0,
            likeCount: 0
          }
        }
      } catch (error) {
        console.error('통계 조회 실패:', error)
        this.myStats = {
          postCount: 0,
          commentCount: 0,
          likeCount: 0
        }
      }
    },



    toggleEditName() {
      if (this.isEditingName) {
        this.saveName()
      } else {
        this.isEditingName = true
        this.editedName = this.userInfo.name || ''
        this.$nextTick(() => {
          if (this.$refs.nameInput) {
            this.$refs.nameInput.focus()
            this.$refs.nameInput.select?.()
          }
        })
      }
    },

    async saveName() {
      try {
        const token = localStorage.getItem('accessToken')
        const response = await axios.put(
          `${import.meta.env.VITE_API_BASE_URL}/member/update/name`,
          { name: this.editedName },
          {
            headers: { 'Authorization': `Bearer ${token}` }
          }
        )
        
        // CommonDto 구조에 맞춰 응답 처리
        if (response.data.status_code === 200) {
          // Vuex 스토어 업데이트
          await this.$store.dispatch('fetchUserInfo')
          this.isEditingName = false
          alert(response.data.status_message || '이름이 변경되었습니다.')
        } else {
          alert(response.data.status_message || '이름 수정에 실패했습니다.')
        }
      } catch (error) {
        console.error('이름 수정 실패:', error)
        const errorMessage = error.response?.data?.status_message || '이름 수정에 실패했습니다.'
        alert(errorMessage)
      }
    },

    cancelEditName() {
      this.isEditingName = false
      this.editedName = ''
    },

    openImageUpload() {
      this.$refs.imageInput.click()
    },

    async handleImageUpload(event) {
      const file = event.target.files[0]
      if (!file) return

      // 파일 크기 체크 (5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('파일 크기는 5MB 이하여야 합니다.')
        return
      }

      // 이미지 파일 타입 체크
      if (!file.type.startsWith('image/')) {
        alert('이미지 파일만 업로드 가능합니다.')
        return
      }

      try {
        // 백엔드에서 기대하는 UpdateProfielImageDto 구조에 맞춰 전송
        const formData = new FormData()
        formData.append('newProfileImage', file)

        const token = localStorage.getItem('accessToken')
        const response = await axios.put(
          `${import.meta.env.VITE_API_BASE_URL}/member/update/profileimage`,
          formData,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'multipart/form-data'
            }
          }
        )

        // CommonDto 구조에 맞춰 응답 처리
        if (response.data.status_code === 200) {
          // Vuex 스토어 업데이트
          await this.$store.dispatch('fetchUserInfo')
          alert(response.data.status_message || '프로필 이미지가 변경되었습니다.')
        } else {
          alert(response.data.status_message || '프로필 이미지 수정에 실패했습니다.')
        }
      } catch (error) {
        console.error('프로필 이미지 수정 실패:', error)
        const errorMessage = error.response?.data?.status_message || '프로필 이미지 수정에 실패했습니다.'
        alert(errorMessage)
      }
    },

    viewPost(post) {
      // 게시글 상세 페이지로 이동
      // post.fridgeId를 사용하여 해당 게시글이 속한 냉장고로 이동
      const fridgeId = post.fridgeId
      
      if (!fridgeId) {
        console.error('게시글에 냉장고 ID가 없습니다:', post)
        alert('게시글 정보를 불러올 수 없습니다.')
        return
      }
      
      // store에 해당 게시글의 냉장고 ID를 설정
      this.$store.commit('setCurrentFridgeId', fridgeId)
      
      // 게시글 상세 페이지로 이동 (냉장고 ID는 store에서 관리)
      this.$router.push(`/fridge/post/${post.id}`)
    },


    formatDate(dateString) {
      if (!dateString) return ''
      
      const date = new Date(dateString)
      return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    },



    async fetchNotificationSettings() {
      try {
        const token = localStorage.getItem('accessToken')
        
        const response = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL}/member/mynoti`,
          {
            headers: { 'Authorization': `Bearer ${token}` }
          }
        )
        
        // CommonDto 구조에 맞춰 응답 처리
        if (response.data.status_code === 200 && response.data.result && Array.isArray(response.data.result)) {
          const serverSettings = response.data.result
          this.notificationSettings.forEach(setting => {
            // 백엔드에서 NotificationSettingDto 객체 배열로 응답하는 경우
            const serverSetting = serverSettings.find(s => s.notificationSettingType === setting.type)
            if (serverSetting) {
              setting.isActive = serverSetting.active
            }
          })
        }
        
        // 원본 설정 저장 (깊은 복사)
        this.originalNotificationSettings = JSON.parse(JSON.stringify(this.notificationSettings))
        this.hasNotificationChanges = false
        
      } catch (error) {
        console.error('알림 설정 조회 실패:', error)
        this.originalNotificationSettings = JSON.parse(JSON.stringify(this.notificationSettings))
        this.hasNotificationChanges = false
      }
    },

    // 알림 설정 변경 감지
    onNotificationSettingChange() {
      // 현재 설정과 원본 설정 비교
      this.hasNotificationChanges = !this.areNotificationSettingsEqual(
        this.notificationSettings, 
        this.originalNotificationSettings
      )
    },

    // 설정 비교 함수
    areNotificationSettingsEqual(current, original) {
      if (current.length !== original.length) return false
      
      return current.every(currentSetting => {
        const originalSetting = original.find(s => s.type === currentSetting.type)
        return originalSetting && originalSetting.isActive === currentSetting.isActive
      })
    },

    // 변경사항 취소
    cancelNotificationChanges() {
      // 원본 설정으로 되돌리기
      this.notificationSettings = JSON.parse(JSON.stringify(this.originalNotificationSettings))
      this.hasNotificationChanges = false
    },

    // 알림 설정 일괄 저장
    async saveNotificationSettings() {
      try {
        this.isSavingNotifications = true
        const token = localStorage.getItem('accessToken')
        
        // 토큰 검증
        if (!token) {
          alert('로그인이 필요합니다. 다시 로그인해주세요.')
          this.$router.push('/login')
          return
        }
        
        // NotificationSettingReqDto 구조에 맞춰 settings 객체 생성
        // Map<String, Boolean> settings 형태로 전송
        const settings = {}
        this.notificationSettings.forEach(setting => {
          // 백엔드에서 ENUM으로 변환하므로 대문자로 전송
          settings[setting.type.toUpperCase()] = setting.isActive
        })

        const requestData = { settings }

        const response = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL}/notification/setting`,
          requestData,
          {
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        )
        
        console.log('알림 설정 저장 응답:', response.data)
        
        // 성공 시 원본 설정 업데이트
        this.originalNotificationSettings = JSON.parse(JSON.stringify(this.notificationSettings))
        this.hasNotificationChanges = false
        
        // 성공 메시지 표시
        alert('알림 설정이 성공적으로 저장되었습니다.')
        
      } catch (error) {
        console.error('알림 설정 저장 실패:', error)
        
        // 상세한 에러 정보 로깅
        if (error.response) {
          console.error('응답 에러:', {
            status: error.response.status,
            statusText: error.response.statusText,
            data: error.response.data,
            headers: error.response.headers
          })
        } else if (error.request) {
          console.error('요청 에러:', error.request)
        } else {
          console.error('설정 에러:', error.message)
        }
        
        // 에러 메시지를 더 자세히 표시
        let errorMessage = '알림 설정 저장에 실패했습니다.'
        if (error.response) {
          // 서버에서 응답을 받았지만 에러 상태코드인 경우
          if (error.response.status === 401) {
            errorMessage = '로그인이 필요합니다. 다시 로그인해주세요.'
          } else if (error.response.status === 403) {
            errorMessage = '권한이 없습니다.'
          } else if (error.response.status === 400) {
            errorMessage = '요청 형식이 올바르지 않습니다.'
          } else if (error.response.status === 500) {
            errorMessage = '서버 내부 오류가 발생했습니다.'
          } else if (error.response.data) {
            // 백엔드에서 보내는 에러 메시지 구조에 따라 조정
            if (error.response.data.message) {
              errorMessage = error.response.data.message
            } else if (error.response.data.status_message) {
              errorMessage = error.response.data.status_message
            } else if (typeof error.response.data === 'string') {
              errorMessage = error.response.data
            }
          }
        } else if (error.request) {
          // 요청은 보냈지만 응답을 받지 못한 경우
          errorMessage = '서버와 연결할 수 없습니다. 네트워크를 확인해주세요.'
        }
        
        alert(errorMessage)
      } finally {
        this.isSavingNotifications = false
      }
    },

    // 회원 탈퇴 처리
    async deleteAccount() {
      try {
        this.isDeletingAccount = true
        const token = localStorage.getItem('accessToken')
        
        if (!token) {
          alert('로그인이 필요합니다.')
          this.$router.push('/login')
          return
        }

        const response = await axios.delete(
          `${import.meta.env.VITE_API_BASE_URL}/member/delete`,
          {
            headers: { 'Authorization': `Bearer ${token}` }
          }
        )

        // CommonDto 구조에 맞춰 응답 처리
        if (response.data.status_code === 200) {
          // 로컬 스토리지 정리
          localStorage.removeItem('accessToken')
          localStorage.removeItem('refreshToken')
          
          // Vuex 상태 초기화
          await this.$store.dispatch('logout')
          
          // 백엔드에서 제공하는 성공 메시지 표시
          alert(response.data.status_message || '회원탈퇴가 성공적으로 되었습니다.\n그동안 저희 Smart Fridge를 이용해주셔서 감사합니다.')
          
          // 로그인 페이지로 이동
          this.$router.push('/login')
        } else {
          // 응답은 받았지만 성공이 아닌 경우
          alert(response.data.status_message || '회원 탈퇴에 실패했습니다.')
        }
        
      } catch (error) {
        console.error('회원 탈퇴 실패:', error)
        
        let errorMessage = '회원 탈퇴에 실패했습니다.'
        if (error.response) {
          if (error.response.status === 401) {
            errorMessage = '로그인이 필요합니다.'
          } else if (error.response.status === 403) {
            errorMessage = '권한이 없습니다.'
          } else if (error.response.data) {
            // CommonDto 구조의 에러 메시지 처리
            if (error.response.data.status_message) {
              errorMessage = error.response.data.status_message
            } else if (error.response.data.message) {
              errorMessage = error.response.data.message
            }
          }
        } else if (error.request) {
          errorMessage = '서버와 연결할 수 없습니다. 네트워크를 확인해주세요.'
        }
        
        // 외래키 제약조건 에러 특별 처리
        if (error.response && error.response.data && 
            typeof error.response.data === 'string' && 
            error.response.data.includes('foreign key constraint fails')) {
          errorMessage = '회원 탈퇴를 진행할 수 없습니다.\n참여 중인 채팅방이나 냉장고가 있어 탈퇴가 제한됩니다.\n관리자에게 문의해주세요.'
        }
        
        alert(errorMessage)
      } finally {
        this.isDeletingAccount = false
        this.showDeleteAccountDialog = false
      }
    }
  }
}
</script>

<style scoped>
.mypage {
  max-width: 1080px;
  min-height: 100%;
  padding: 32px clamp(16px, 3vw, 40px) 48px;
  background: var(--sf-bg);
}

.page-head {
  margin-bottom: 20px;
}

.mypage-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(300px, 380px);
  grid-template-areas:
    'profile settings'
    'posts settings'
    'danger danger';
  gap: 20px;
  align-items: start;
}

.panel {
  border-radius: var(--sf-radius-lg);
  background: var(--sf-surface);
  box-shadow: var(--sf-shadow);
  padding: 24px;
}

.profile { grid-area: profile; display: flex; gap: 24px; }
.posts { grid-area: posts; padding-bottom: 8px; }
.settings { grid-area: settings; }
.danger { grid-area: danger; }

/* 프로필 */
.avatar-wrap {
  position: relative;
  flex-shrink: 0;
  width: 88px;
  height: 88px;
}

.avatar {
  width: 88px;
  height: 88px;
  border-radius: 50%;
}

.avatar-initial {
  display: grid;
  place-items: center;
  background: var(--sf-mint-soft);
  font-size: 34px;
  font-weight: 800;
  color: var(--sf-primary);
}

.avatar-edit {
  position: absolute;
  right: -2px;
  bottom: -2px;
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border: 2px solid var(--sf-surface);
  border-radius: 50%;
  background: var(--sf-text);
  color: #fff;
  cursor: pointer;
}

.profile-body {
  flex: 1;
  min-width: 0;
}

.name-row {
  display: flex;
  align-items: center;
  gap: 4px;
}

.profile-name {
  margin: 0;
  font-size: 22px;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--sf-text);
}

.name-edit {
  display: flex;
  align-items: center;
  gap: 8px;
  max-width: 360px;
}

.profile-facts {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 24px;
  margin: 8px 0 0;
  font-size: 14px;
}

.profile-facts div {
  display: flex;
  gap: 8px;
}

.profile-facts dt {
  color: var(--sf-text-faint);
}

.profile-facts dd {
  margin: 0;
  color: var(--sf-text-sub);
}

.activity {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  margin: 20px 0 0;
  padding-top: 16px;
  border-top: 1px solid var(--sf-line);
}

.activity div + div {
  padding-left: 16px;
  border-left: 1px solid var(--sf-line);
}

.activity dt {
  font-size: 13px;
  color: var(--sf-text-sub);
}

.activity dd {
  margin: 4px 0 0;
  font-size: 22px;
  font-weight: 700;
  color: var(--sf-text);
}

/* 패널 공통 */
.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}

/* 내가 쓴 글 */
.post-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.post-list li + li {
  border-top: 1px solid var(--sf-line);
}

.post-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  width: 100%;
  padding: 14px 0;
  border: none;
  background: none;
  font: inherit;
  text-align: left;
  color: inherit;
  cursor: pointer;
}

.post-row:hover .post-title {
  text-decoration: underline;
  text-underline-offset: 3px;
}

.post-main {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.post-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--sf-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.post-meta {
  display: flex;
  gap: 10px;
  font-size: 13px;
  color: var(--sf-text-faint);
}

.post-counts {
  display: flex;
  gap: 12px;
  flex-shrink: 0;
  font-size: 13px;
  color: var(--sf-text-faint);
}

.post-counts span {
  display: inline-flex;
  align-items: center;
  gap: 3px;
}

.empty-text {
  margin: 8px 0 16px;
  font-size: 14px;
  color: var(--sf-text-sub);
}

.state-box {
  display: grid;
  place-items: center;
  padding: 32px 0;
}

/* 알림 설정 */
.setting-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.setting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 0;
}

.setting-row + .setting-row {
  border-top: 1px solid var(--sf-line);
}

.setting-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.setting-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--sf-text);
}

.setting-desc {
  font-size: 13px;
  line-height: 1.5;
  color: var(--sf-text-faint);
}

.settings-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 12px;
  padding-top: 16px;
  border-top: 1px solid var(--sf-line);
}

.changes-text {
  flex: 1 1 100%;
  font-size: 13px;
  color: var(--sf-soon-ink);
}

/* 탈퇴 */
.danger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 20px 24px;
  border: 1px solid var(--sf-line-strong);
  border-radius: var(--sf-radius-lg);
}

.danger-title {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  color: var(--sf-text);
}

.danger-desc {
  margin: 4px 0 0;
  font-size: 13px;
  color: var(--sf-text-sub);
}

.dialog-body {
  font-size: 15px;
  line-height: 1.6;
  color: var(--sf-text-sub);
}

.dialog-body ul {
  margin: 8px 0 0;
  padding-left: 20px;
}

@media (max-width: 960px) {
  .mypage-grid {
    grid-template-columns: minmax(0, 1fr);
    grid-template-areas: 'profile' 'posts' 'settings' 'danger';
  }
}

@media (max-width: 600px) {
  .mypage {
    padding: 16px 12px 32px;
  }

  .panel {
    padding: 20px 16px;
  }

  .profile {
    flex-direction: column;
    gap: 16px;
  }

  .danger {
    flex-direction: column;
    align-items: flex-start;
  }

  .post-counts {
    display: none;
  }
}
</style>

