<template>
  <div class="admin-layout">
    <div class="user-management">
      <div class="header">
        <h1>사용자 관리</h1>
        <button @click="logout" class="logout-btn">로그아웃</button>
      </div>
      
      <div class="navigation-menu">
        <router-link to="/admin" class="nav-item">대시보드</router-link>
        <router-link to="/admin/inquiry" class="nav-item">문의 목록</router-link>
        <router-link to="/admin/notification" class="nav-item">알림 목록</router-link>
        <router-link to="/admin/users" class="nav-item active">사용자 관리</router-link>
      </div>

      <div class="filters">
        <select v-model="roleFilter" @change="filterUsers">
          <option value="">전체 역할</option>
          <option value="ADMIN">관리자</option>
          <option value="USER">일반사용자</option>
        </select>
        <input type="text" v-model="searchQuery" placeholder="이름 또는 이메일로 검색..." @input="filterUsers">
        <button @click="exportUsers" class="export-btn">사용자 목록 내보내기</button>
      </div>

      <div class="user-table">
        <table>
          <thead>
            <tr>
              <th>id</th>
              <th>이름</th>
              <th>이메일</th>
              <th>역할</th>
              <th>상태</th>
              <th>가입일</th>
              <th>작업</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in filteredUsers" :key="user.id">
              <td>{{ user.id }}</td>
              <td>{{ user.name }}</td>
              <td>{{ user.email }}</td>
              <td>
                <span :class="getRoleClass(user.role)">
                  {{ user.role }}
                </span>
              </td>
              <td>
                <span :class="getStatusClass(user.status)">
                  {{ user.status }}
                </span>
              </td>
              <td>{{ user.createdAt }}</td>
              <td>
                <button @click="viewUser(user)" class="view-btn">보기</button>
                <button @click="confirmDeleteUser(user)" class="delete-btn">삭제</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 사용자 상세 보기 모달 -->
      <div v-if="selectedUser" class="modal">
        <div class="modal-content">
          <div class="modal-header">
            <h2>사용자 정보</h2>
            <button @click="closeModal" class="close-btn">×</button>
          </div>
          <div class="modal-body">
            <div class="user-detail">
              <p><strong>ID:</strong> {{ selectedUser.id }}</p>
              <p><strong>이름:</strong> {{ selectedUser.name }}</p>
              <p><strong>이메일:</strong> {{ selectedUser.email }}</p>
              <p><strong>역할:</strong> {{ selectedUser.role }}</p>
              <p><strong>상태:</strong> {{ selectedUser.status }}</p>
              <p><strong>가입일:</strong> {{ selectedUser.createdAt }}</p>
              <p><strong>프로필 이미지:</strong> {{ selectedUser.profileImage || '없음' }}</p>
            </div>
            
            <div class="modal-actions">
              <button @click="closeModal" class="close-modal-btn">닫기</button>
            </div>
          </div>
        </div>
      </div>

      <!-- 삭제 확인 모달 -->
      <div v-if="deleteModal" class="modal">
        <div class="modal-content delete-modal">
          <div class="modal-header">
            <h2>사용자 삭제 확인</h2>
            <button @click="closeDeleteModal" class="close-btn">×</button>
          </div>
          <div class="modal-body">
            <div class="delete-warning">
              <div class="warning-icon">⚠️</div>
              <h3>정말로 이 사용자를 삭제하시겠습니까?</h3>
              <p>삭제된 사용자는 복구할 수 없습니다.</p>
              <div class="user-info">
                <p><strong>이름:</strong> {{ userToDelete?.name }}</p>
                <p><strong>이메일:</strong> {{ userToDelete?.email }}</p>
              </div>
            </div>
            
            <div class="modal-actions">
              <button @click="closeDeleteModal" class="cancel-btn">취소</button>
              <button @click="deleteUser" class="confirm-delete-btn" :disabled="deleting">
                {{ deleting ? '삭제 중...' : '삭제' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import { snackbar } from '@/composables/snackbar';

export default {
  name: 'UserManagement',
  data() {
    return {
      users: [],
      filteredUsers: [],
      roleFilter: '',
      searchQuery: '',
      selectedUser: null,
      loading: true,
      deleteModal: false,
      userToDelete: null,
      deleting: false
    }
  },
  mounted() {
    this.loadUsers();
  },
  methods: {
    async loadUsers() {
      try {
        this.loading = true;
        const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/admin/member/list`);
        
        console.log('Member List API Response:', response.data);
        
        if (response.data.status_code === 200) {
          console.log('First member item:', response.data.result[0]);
          
          this.users = response.data.result
            .map(member => {
              console.log('Member role 값:', member.role, '타입:', typeof member.role);
              return {
                // MemberResDto 실제 구조에 맞게 매핑
                id: member.id, // UUID
                name: member.name,
                email: member.email,
                role: member.role ? member.role : 'USER', // API에서 받은 role 값 사용, 없으면 기본값 USER
                status: '활성', // MemberResDto에 status 필드가 없으므로 기본값
                createdAt: member.createdTime ? new Date(member.createdTime).toLocaleDateString() : '-',
                lastLoginAt: member.lastLoginTime ? new Date(member.lastLoginTime).toLocaleString() : '-',
                profileImage: member.profileImage || null
              };
            });
          this.filteredUsers = [...this.users];
        }
      } catch (error) {
        console.error('사용자 목록 로드 실패:', error);
        console.error('Error details:', error.response?.data);
        snackbar.show('사용자 목록 로드에 실패했습니다.', 'error');
      } finally {
        this.loading = false;
      }
    },
    
    filterUsers() {
      let filtered = [...this.users];
      
      if (this.roleFilter) {
        filtered = filtered.filter(user => user.role === this.roleFilter);
      }
      
      
      if (this.searchQuery) {
        const query = this.searchQuery.toLowerCase();
        filtered = filtered.filter(user => 
          user.name.toLowerCase().includes(query) || 
          user.email.toLowerCase().includes(query)
        );
      }
      
      this.filteredUsers = filtered;
    },
    
    getRoleClass(role) {
      return role === 'ADMIN' ? 'role-admin' : 'role-user';
    },
    
    getStatusClass(status) {
      const classes = {
        '활성': 'status-active',
        '비활성': 'status-inactive',
        '정지': 'status-suspended'
      };
      return classes[status] || '';
    },
    
    async viewUser(user) {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/admin/member/detail/${user.email}`);
        
        console.log('Member Detail API Response:', response.data);
        
        if (response.data.status_code === 200) {
          const memberDetail = response.data.result;
          this.selectedUser = {
            ...user,
            // MemberResDto 실제 구조에 맞게 매핑
            id: memberDetail.id,
            name: memberDetail.name,
            email: memberDetail.email,
            createdAt: memberDetail.createdTime ? new Date(memberDetail.createdTime).toLocaleDateString() : '-',
            lastLoginAt: memberDetail.lastLoginTime ? new Date(memberDetail.lastLoginTime).toLocaleString() : '-',
            profileImage: memberDetail.profileImage || null
          };
        }
      } catch (error) {
        console.error('사용자 상세 정보 로드 실패:', error);
        console.error('Error details:', error.response?.data);
        this.selectedUser = user;
      }
    },
    
    exportUsers() {
      try {
        const csvContent = this.generateCSV();
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `users_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
      } catch (error) {
        console.error('사용자 목록 내보내기 실패:', error);
      }
    },
    
    generateCSV() {
      const headers = ['ID', '이름', '이메일', '역할', '상태', '가입일'];
      const rows = this.filteredUsers.map(user => [
        user.id,
        user.name,
        user.email,
        user.role,
        user.status,
        user.createdAt,
      ]);
      
      return [headers, ...rows]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');
    },
    
    closeModal() {
      this.selectedUser = null;
    },
    
    logout() {
      localStorage.clear();
      this.$store.dispatch('user/logout');
      this.$router.push('/');
    },

    // 삭제 확인 모달 열기
    confirmDeleteUser(user) {
      this.userToDelete = user;
      this.deleteModal = true;
    },

    // 삭제 확인 모달 닫기
    closeDeleteModal() {
      this.deleteModal = false;
      this.userToDelete = null;
      this.deleting = false;
    },

    // 사용자 삭제 실행
    async deleteUser() {
      if (!this.userToDelete) return;

      try {
        this.deleting = true;
        
        const response = await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/admin/member/delete/`, {
          data: this.userToDelete.email,
          headers: {
            'Content-Type': 'text/plain'
          }
        });

        console.log('Delete Member API Response:', response.data);

        if (response.data.status_code === 200) {
          snackbar.show('사용자가 성공적으로 삭제되었습니다.', 'success');

          // 사용자 목록에서 제거
          this.users = this.users.filter(user => user.email !== this.userToDelete.email);
          this.filteredUsers = this.filteredUsers.filter(user => user.email !== this.userToDelete.email);
          
          this.closeDeleteModal();
        } else {
          throw new Error(response.data.status_message || '사용자 삭제에 실패했습니다.');
        }
      } catch (error) {
        console.error('사용자 삭제 실패:', error);
        console.error('Error details:', error.response?.data);
        
        snackbar.show(error.response?.data?.status_message || '사용자 삭제에 실패했습니다.', 'error');
      } finally {
        this.deleting = false;
      }
    }
  }
}
</script>

<style scoped src="@/styles/pages/admin.css"></style>
