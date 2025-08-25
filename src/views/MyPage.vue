<template>
  <div class="mypage-container">
    <!-- 헤더 섹션 -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-info">
          <h1 class="page-title">마이페이지</h1>
          <p class="page-subtitle">내 정보를 관리하고 활동 내역을 확인하세요</p>
        </div>
      </div>
    </div>

    <div class="mypage-content">
      <!-- 프로필 섹션 -->
      <v-card class="profile-card">
        <v-card-title class="profile-header">
          <v-icon class="mr-2">mdi-account-circle</v-icon>
          프로필 정보
        </v-card-title>
        <v-card-text>
          <div class="profile-section">
            <div class="profile-image-section">
              <div class="profile-image-container">
                <div v-if="!userInfo.profileImage" class="profile-avatar-bg">
                  <span class="profile-avatar-initial">{{ userInitial }}</span>
                </div>
                <v-img
                  v-else
                  :src="userInfo.profileImage"
                  alt="Profile Image"
                  class="profile-avatar-image"
                  width="120"
                  height="120"
                />
                <v-btn
                  @click="openImageUpload"
                  class="edit-image-btn"
                  icon
                  size="small"
                  color="primary"
                >
                  <v-icon>mdi-camera</v-icon>
                </v-btn>
              </div>
              <input
                ref="imageInput"
                type="file"
                accept="image/*"
                style="display: none"
                @change="handleImageUpload"
              />
            </div>
            
            <div class="profile-info-section">
              <div class="info-row">
                <label class="info-label">이름</label>
                <div class="info-value-container">
                  <v-text-field
                    v-if="isEditingName"
                    v-model="editedName"
                    variant="outlined"
                    density="compact"
                    class="edit-name-field"
                    @keyup.enter="saveName"
                    @keyup.esc="cancelEditName"
                  />
                  <span v-else class="info-value">{{ userInfo.name || '이름 없음' }}</span>
                  <v-btn
                    @click="toggleEditName"
                    :icon="isEditingName ? 'mdi-check' : 'mdi-pencil'"
                    size="small"
                    variant="text"
                    color="primary"
                    class="edit-btn"
                  />
                  <v-btn
                    v-if="isEditingName"
                    @click="cancelEditName"
                    icon="mdi-close"
                    size="small"
                    variant="text"
                    color="grey"
                    class="cancel-btn"
                  />
                </div>
              </div>
              
              <div class="info-row">
                <label class="info-label">이메일</label>
                <span class="info-value">{{ userInfo.email || '이메일 없음' }}</span>
              </div>
              
              <div class="info-row">
                <label class="info-label">가입일</label>
                <span class="info-value">{{ formatDate(userInfo.createdAt) }}</span>
              </div>
            </div>
          </div>
        </v-card-text>
      </v-card>

      <!-- 알림 설정 섹션 -->
      <v-card class="notification-settings-card">
        <v-card-title class="notification-header">
          <v-icon class="mr-2">mdi-bell-outline</v-icon>
          알림 설정
        </v-card-title>
        <v-card-text>
          <div class="notification-settings">
            <div class="setting-description">
              <p class="setting-desc-text">원하는 알림을 선택하여 설정하세요</p>
            </div>
            <div class="settings-list">
              <div 
                v-for="setting in notificationSettings" 
                :key="setting.type" 
                class="setting-item"
              >
                <div class="setting-info">
                  <div class="setting-title">{{ setting.title }}</div>
                  <div class="setting-description">{{ setting.description }}</div>
                </div>
                <v-switch
                  v-model="setting.isActive"
                  @change="onNotificationSettingChange"
                  color="primary"
                  hide-details
                  class="setting-switch"
                />
              </div>
            </div>
            
            <!-- 변경사항이 있을 때 저장/취소 버튼 표시 -->
            <div v-if="hasNotificationChanges" class="notification-actions">
              <v-divider class="mb-4"></v-divider>
              <div class="action-buttons">
                <v-btn
                  @click="cancelNotificationChanges"
                  variant="outlined"
                  color="grey"
                  :disabled="isSavingNotifications"
                  class="mr-3"
                >
                  <v-icon left>mdi-close</v-icon>
                  취소
                </v-btn>
                <v-btn
                  @click="saveNotificationSettings"
                  color="primary"
                  :loading="isSavingNotifications"
                  :disabled="isSavingNotifications"
                >
                  <v-icon left>mdi-content-save</v-icon>
                  설정 저장
                </v-btn>
              </div>
              <div class="changes-info">
                <v-icon size="16" color="orange">mdi-information</v-icon>
                <span class="changes-text">변경사항이 있습니다. 저장 버튼을 클릭하여 적용하세요.</span>
              </div>
            </div>
          </div>
        </v-card-text>
      </v-card>

      <!-- 활동 통계 섹션 -->
      <v-card class="stats-card">
        <v-card-title class="stats-header">
          <v-icon class="mr-2">mdi-chart-line</v-icon>
          활동 통계
        </v-card-title>
        <v-card-text>
          <div class="stats-grid">
            <div class="stat-item">
              <div class="stat-number">{{ myStats.postCount }}</div>
              <div class="stat-label">작성한 글</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">{{ myStats.commentCount }}</div>
              <div class="stat-label">작성한 댓글</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">{{ myStats.likeCount }}</div>
              <div class="stat-label">받은 좋아요</div>
            </div>
          </div>
        </v-card-text>
      </v-card>

      <!-- 내가 작성한 글 섹션 -->
      <v-card class="posts-card">
        <v-card-title class="posts-header">
          <v-icon class="mr-2">mdi-post-outline</v-icon>
          내가 작성한 글
          <v-spacer></v-spacer>
          <v-btn
            @click="fetchMyPosts"
            icon="mdi-refresh"
            size="small"
            variant="text"
            color="primary"
          />
        </v-card-title>
        <v-card-text>
          <div v-if="isLoadingPosts" class="loading-container">
            <v-progress-circular indeterminate color="primary" size="32" />
            <span class="loading-text">게시글을 불러오는 중...</span>
          </div>
          
          <div v-else-if="myPosts.length > 0" class="posts-list">
            <div
              v-for="post in myPosts"
              :key="post.id"
              class="post-item"
              @click="viewPost(post)"
            >
              <div class="post-content">
                <div class="post-title">{{ post.title }}</div>
                <div class="post-meta">
                  <span class="post-category">{{ post.category }}</span>
                  <span class="post-date">{{ formatDate(post.createdAt) }}</span>
                </div>
                <div class="post-stats">
                  <span class="stat">
                    <v-icon size="16">mdi-eye</v-icon>
                    {{ post.viewCount || 0 }}
                  </span>
                  <span class="stat">
                    <v-icon size="16">mdi-heart</v-icon>
                    {{ post.likeCount || 0 }}
                  </span>
                  <span class="stat">
                    <v-icon size="16">mdi-comment</v-icon>
                    {{ post.commentCount || 0 }}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <div v-else class="no-posts">
            <v-icon size="48" color="grey-lighten-1">mdi-post-outline</v-icon>
            <p class="no-posts-text">작성한 게시글이 없습니다</p>
            <v-btn color="primary" @click="goToCommunity">
              첫 게시글 작성하기
            </v-btn>
          </div>
        </v-card-text>
      </v-card>

      <!-- 최근 활동 섹션 -->
      <v-card class="activity-card">
        <v-card-title class="activity-header">
          <v-icon class="mr-2">mdi-history</v-icon>
          최근 활동
        </v-card-title>
        <v-card-text>
          <div v-if="recentActivities.length > 0" class="activities-list">
            <div
              v-for="activity in recentActivities"
              :key="activity.id"
              class="activity-item"
            >
              <v-icon :color="getActivityColor(activity.type)" class="activity-icon">
                {{ getActivityIcon(activity.type) }}
              </v-icon>
              <div class="activity-content">
                <div class="activity-text">{{ activity.description }}</div>
                <div class="activity-time">{{ formatDate(activity.createdAt) }}</div>
              </div>
            </div>
          </div>
          <div v-else class="no-activity">
            <p class="no-activity-text">최근 활동이 없습니다</p>
          </div>
        </v-card-text>
      </v-card>
    </div>
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
      recentActivities: [],
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
      isSavingNotifications: false // 저장 중 상태
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
    await this.fetchRecentActivities()
    await this.fetchNotificationSettings()
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
          `${process.env.VUE_APP_API_BASE_URL}/api/my/posts?page=0&size=5`,
          {
            headers: { 'Authorization': `Bearer ${token}` }
          }
        )
        this.myPosts = response.data.content || []
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
          `${process.env.VUE_APP_API_BASE_URL}/api/my/stats`,
          {
            headers: { 'Authorization': `Bearer ${token}` }
          }
        )
        this.myStats = response.data
      } catch (error) {
        console.error('통계 조회 실패:', error)
      }
    },

    async fetchRecentActivities() {
      try {
        const token = localStorage.getItem('accessToken')
        const response = await axios.get(
          `${process.env.VUE_APP_API_BASE_URL}/api/my/activities?size=10`,
          {
            headers: { 'Authorization': `Bearer ${token}` }
          }
        )
        this.recentActivities = response.data || []
      } catch (error) {
        console.error('최근 활동 조회 실패:', error)
        this.recentActivities = []
      }
    },

    toggleEditName() {
      if (this.isEditingName) {
        this.saveName()
      } else {
        this.isEditingName = true
        this.editedName = this.userInfo.name || ''
      }
    },

    async saveName() {
      try {
        const token = localStorage.getItem('accessToken')
        await axios.put(
          `${process.env.VUE_APP_API_BASE_URL}/api/my/profile/name`,
          { name: this.editedName },
          {
            headers: { 'Authorization': `Bearer ${token}` }
          }
        )
        
        // Vuex 스토어 업데이트
        await this.$store.dispatch('fetchUserInfo')
        this.isEditingName = false
        alert('이름이 수정되었습니다.')
      } catch (error) {
        console.error('이름 수정 실패:', error)
        alert('이름 수정에 실패했습니다.')
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
        const formData = new FormData()
        formData.append('image', file)

        const token = localStorage.getItem('accessToken')
        await axios.put(
          `${process.env.VUE_APP_API_BASE_URL}/api/my/profile/image`,
          formData,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'multipart/form-data'
            }
          }
        )

        // Vuex 스토어 업데이트
        await this.$store.dispatch('fetchUserInfo')
        alert('프로필 이미지가 수정되었습니다.')
      } catch (error) {
        console.error('프로필 이미지 수정 실패:', error)
        alert('프로필 이미지 수정에 실패했습니다.')
      }
    },

    viewPost(post) {
      // 게시글 상세 페이지로 이동
      this.$router.push(`/fridge/${post.fridgeId}/community/post/${post.id}`)
    },

    goToCommunity() {
      // 커뮤니티 페이지로 이동
      const fridgeId = this.$route.params.fridgeId || 'default'
      this.$router.push(`/fridge/${fridgeId}/community`)
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

    getActivityIcon(type) {
      const icons = {
        'post': 'mdi-post-outline',
        'comment': 'mdi-comment-outline',
        'like': 'mdi-heart-outline',
        'join': 'mdi-account-plus-outline'
      }
      return icons[type] || 'mdi-circle-outline'
    },

    getActivityColor(type) {
      const colors = {
        'post': 'blue',
        'comment': 'green',
        'like': 'red',
        'join': 'purple'
      }
      return colors[type] || 'grey'
    },

    async fetchNotificationSettings() {
      try {
        const token = localStorage.getItem('accessToken')
        
        // 백엔드 API가 구현되지 않았을 경우를 대비한 임시 처리
        console.log('알림 설정 조회 시도 중...')
        
        const response = await axios.get(
          `${process.env.VUE_APP_API_BASE_URL}/notification/setting`,
          {
            headers: { 'Authorization': `Bearer ${token}` }
          }
        )
        
        console.log('알림 설정 조회 성공:', response.data)
        
        // 백엔드에서 받은 설정으로 현재 설정 업데이트
        if (response.data && Array.isArray(response.data)) {
          const serverSettings = response.data
          this.notificationSettings.forEach(setting => {
            // 백엔드에서 NotificationSetting 객체 배열로 응답하는 경우
            const serverSetting = serverSettings.find(s => s.notificationSettingType === setting.type)
            if (serverSetting) {
              setting.isActive = serverSetting.isActive
            }
          })
        }
        
        // 원본 설정 저장 (깊은 복사)
        this.originalNotificationSettings = JSON.parse(JSON.stringify(this.notificationSettings))
        this.hasNotificationChanges = false
        
      } catch (error) {
        console.error('알림 설정 조회 실패:', error)
        
        // 404나 기타 에러 시 기본값으로 초기화
        console.log('기본 알림 설정으로 초기화')
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
        
        // 백엔드 DTO 검증: NotificationSettingReqDto { Map<String, Boolean> settings }
        console.log('전송할 데이터 구조 검증:', {
          isSettingsObject: typeof settings === 'object',
          settingsKeys: Object.keys(settings),
          settingsValues: Object.values(settings),
          allValuesBoolean: Object.values(settings).every(v => typeof v === 'boolean')
        })
        
        // 디버깅을 위한 로그 추가
        console.log('알림 설정 저장 요청:', {
          url: `${process.env.VUE_APP_API_BASE_URL}/notification/setting`,
          data: requestData,
          token: token ? 'exists' : 'missing'
        })

        const response = await axios.post(
          `${process.env.VUE_APP_API_BASE_URL}/notification/setting`,
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
    }
  }
}
</script>

<style scoped>
.mypage-container {
  padding: 32px;
  margin-left: 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  position: relative;
}

.mypage-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  opacity: 0.1;
  z-index: -1;
}

.page-header {
  background: white;
  padding: 20px 24px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-info {
  flex: 1;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: #333;
  margin: 0 0 8px 0;
}

.page-subtitle {
  font-size: 16px;
  color: #666;
  margin: 0;
}

.mypage-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.activity-card {
  grid-column: 1 / -1;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.profile-card,
.notification-settings-card {
  grid-column: 1 / -1;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.profile-header,
.stats-header,
.posts-header,
.activity-header,
.notification-header {
  background: #f8f9fa;
  font-weight: 600;
  color: #333;
  padding: 16px 20px;
}

.profile-section {
  display: flex;
  gap: 32px;
  align-items: flex-start;
}

.profile-image-section {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.profile-image-container {
  position: relative;
  margin-bottom: 16px;
}

.profile-avatar-bg {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 120px;
  height: 120px;
  background: linear-gradient(180deg, #0468FF 0%, #789DFB 100%);
  border-radius: 60px;
}

.profile-avatar-initial {
  font-weight: 700;
  font-size: 48px;
  color: #FFF;
}

.profile-avatar-image {
  border-radius: 60px;
  object-fit: cover;
}

.edit-image-btn {
  position: absolute;
  bottom: 8px;
  right: 8px;
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.profile-info-section {
  flex: 1;
}

.info-row {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  min-height: 40px;
}

.info-label {
  font-weight: 600;
  color: #333;
  min-width: 80px;
  margin-right: 20px;
}

.info-value-container {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.info-value {
  font-size: 16px;
  color: #666;
}

.edit-name-field {
  max-width: 200px;
}

.edit-btn,
.cancel-btn {
  min-width: auto !important;
}

.stats-card {
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  text-align: center;
}

.stat-item {
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
}

.stat-number {
  font-size: 32px;
  font-weight: 700;
  color: #1976d2;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 14px;
  color: #666;
  font-weight: 500;
}

.posts-card {
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.loading-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 40px;
}

.loading-text {
  color: #666;
}

.posts-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.post-item {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.post-item:hover {
  background: #e9ecef;
  transform: translateY(-2px);
}

.post-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

.post-meta {
  display: flex;
  gap: 12px;
  margin-bottom: 8px;
}

.post-category {
  background: #1976d2;
  color: white;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.post-date {
  font-size: 12px;
  color: #666;
}

.post-stats {
  display: flex;
  gap: 16px;
}

.stat {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  color: #666;
}

.no-posts,
.no-activity {
  text-align: center;
  padding: 40px 20px;
  color: #666;
}

.no-posts-text,
.no-activity-text {
  margin: 16px 0;
  font-size: 16px;
}

.activities-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.activity-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
}

.activity-icon {
  flex-shrink: 0;
}

.activity-content {
  flex: 1;
}

.activity-text {
  font-size: 14px;
  color: #333;
  margin-bottom: 4px;
}

.activity-time {
  font-size: 12px;
  color: #666;
}

/* 알림 설정 스타일 */
.notification-settings {
  padding: 8px 0;
}

.setting-description {
  margin-bottom: 20px;
}

.setting-desc-text {
  font-size: 14px;
  color: #666;
  margin: 0;
}

.settings-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.setting-item:hover {
  background: #e9ecef;
}

.setting-info {
  flex: 1;
  margin-right: 16px;
}

.setting-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.setting-description {
  font-size: 14px;
  color: #666;
  line-height: 1.4;
}

.setting-switch {
  flex-shrink: 0;
}

/* 알림 설정 액션 버튼 스타일 */
.notification-actions {
  margin-top: 20px;
}

.action-buttons {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-bottom: 12px;
}

.changes-info {
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: center;
  padding: 8px 16px;
  background: #fff3e0;
  border-radius: 6px;
  border-left: 4px solid #ff9800;
}

.changes-text {
  font-size: 14px;
  color: #f57c00;
  font-weight: 500;
}

@media (max-width: 600px) {
  .mypage-container {
    padding: 16px;
    margin-left: 8px;
  }
}

@media (max-width: 768px) {
  .mypage-content {
    grid-template-columns: 1fr;
  }
  
  .profile-section {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .info-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .info-value-container {
    width: 100%;
  }
  
  .setting-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .setting-info {
    margin-right: 0;
    width: 100%;
  }
  
  .setting-switch {
    align-self: flex-end;
  }
  
  .action-buttons {
    flex-direction: column;
    gap: 8px;
  }
  
  .action-buttons .v-btn {
    width: 100%;
    margin: 0 !important;
  }
  
  .changes-info {
    text-align: center;
  }
}
</style>
