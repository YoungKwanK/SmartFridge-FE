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
        <select v-model="statusFilter" @change="filterUsers">
          <option value="">전체 상태</option>
          <option value="활성">활성</option>
          <option value="비활성">비활성</option>
          <option value="정지">정지</option>
        </select>
        <input type="text" v-model="searchQuery" placeholder="이름 또는 이메일로 검색..." @input="filterUsers">
        <button @click="exportUsers" class="export-btn">사용자 목록 내보내기</button>
      </div>

      <div class="user-table">
        <table>
          <thead>
            <tr>
              <th>번호</th>
              <th>이름</th>
              <th>이메일</th>
              <th>역할</th>
              <th>상태</th>
              <th>가입일</th>
              <th>마지막 로그인</th>
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
              <td>{{ user.lastLoginAt || '-' }}</td>
              <td>
                <button @click="viewUser(user)" class="view-btn">보기</button>
                <button @click="editUser(user)" class="edit-btn">수정</button>
                <button v-if="user.status === '활성'" @click="deactivateUser(user)" class="deactivate-btn">비활성화</button>
                <button v-else @click="activateUser(user)" class="activate-btn">활성화</button>
                <button @click="deleteUser(user)" class="delete-btn">삭제</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 사용자 상세 보기/수정 모달 -->
      <div v-if="selectedUser" class="modal">
        <div class="modal-content">
          <div class="modal-header">
            <h2>{{ isEditing ? '사용자 수정' : '사용자 정보' }}</h2>
            <button @click="closeModal" class="close-btn">×</button>
          </div>
          <div class="modal-body">
            <div v-if="!isEditing" class="user-detail">
              <p><strong>ID:</strong> {{ selectedUser.id }}</p>
              <p><strong>이름:</strong> {{ selectedUser.name }}</p>
              <p><strong>이메일:</strong> {{ selectedUser.email }}</p>
              <p><strong>역할:</strong> {{ selectedUser.role }}</p>
              <p><strong>상태:</strong> {{ selectedUser.status }}</p>
              <p><strong>가입일:</strong> {{ selectedUser.createdAt }}</p>
              <p><strong>마지막 로그인:</strong> {{ selectedUser.lastLoginAt || '-' }}</p>
              <p><strong>프로필 이미지:</strong> {{ selectedUser.profileImage || '없음' }}</p>
            </div>
            
            <div v-else class="user-edit-form">
              <div class="form-group">
                <label>이름:</label>
                <input type="text" v-model="editForm.name" required>
              </div>
              <div class="form-group">
                <label>이메일:</label>
                <input type="email" v-model="editForm.email" required>
              </div>
              <div class="form-group">
                <label>역할:</label>
                <select v-model="editForm.role">
                  <option value="USER">일반사용자</option>
                  <option value="ADMIN">관리자</option>
                </select>
              </div>
              <div class="form-group">
                <label>상태:</label>
                <select v-model="editForm.status">
                  <option value="활성">활성</option>
                  <option value="비활성">비활성</option>
                  <option value="정지">정지</option>
                </select>
              </div>
              
              <div class="form-actions">
                <button @click="saveUser" class="save-btn">저장</button>
                <button @click="cancelEdit" class="cancel-btn">취소</button>
              </div>
            </div>
            
            <div v-if="!isEditing" class="modal-actions">
              <button @click="startEdit" class="edit-btn">수정</button>
              <button @click="closeModal" class="close-modal-btn">닫기</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'UserManagement',
  data() {
    return {
      users: [],
      filteredUsers: [],
      roleFilter: '',
      statusFilter: '',
      searchQuery: '',
      selectedUser: null,
      isEditing: false,
      editForm: {
        name: '',
        email: '',
        role: '',
        status: ''
      }
    }
  },
  mounted() {
    this.loadUsers();
  },
  methods: {
    async loadUsers() {
      try {
        // 실제 API 호출로 대체 필요
        this.users = [
          { 
            id: 1, 
            name: '관리자1', 
            email: 'admin1@email.com', 
            role: 'ADMIN', 
            status: '활성', 
            createdAt: '2024-01-01',
            lastLoginAt: '2024-01-15 14:30',
            profileImage: null
          },
          { 
            id: 2, 
            name: '사용자1', 
            email: 'user1@email.com', 
            role: 'USER', 
            status: '활성', 
            createdAt: '2024-01-02',
            lastLoginAt: '2024-01-15 10:15',
            profileImage: 'profile1.jpg'
          },
          { 
            id: 3, 
            name: '사용자2', 
            email: 'user2@email.com', 
            role: 'USER', 
            status: '비활성', 
            createdAt: '2024-01-03',
            lastLoginAt: '2024-01-10 09:45',
            profileImage: null
          },
          { 
            id: 4, 
            name: '사용자3', 
            email: 'user3@email.com', 
            role: 'USER', 
            status: '정지', 
            createdAt: '2024-01-04',
            lastLoginAt: '2024-01-08 16:20',
            profileImage: 'profile3.jpg'
          }
        ];
        this.filteredUsers = [...this.users];
      } catch (error) {
        console.error('사용자 목록 로드 실패:', error);
      }
    },
    
    filterUsers() {
      let filtered = [...this.users];
      
      if (this.roleFilter) {
        filtered = filtered.filter(user => user.role === this.roleFilter);
      }
      
      if (this.statusFilter) {
        filtered = filtered.filter(user => user.status === this.statusFilter);
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
    
    viewUser(user) {
      this.selectedUser = user;
      this.isEditing = false;
    },
    
    editUser(user) {
      this.selectedUser = user;
      this.isEditing = true;
      this.editForm = {
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status
      };
    },
    
    startEdit() {
      this.isEditing = true;
      this.editForm = {
        name: this.selectedUser.name,
        email: this.selectedUser.email,
        role: this.selectedUser.role,
        status: this.selectedUser.status
      };
    },
    
    async saveUser() {
      try {
        // 실제 API 호출로 대체 필요
        Object.assign(this.selectedUser, this.editForm);
        
        // 목록 업데이트
        const index = this.users.findIndex(u => u.id === this.selectedUser.id);
        if (index !== -1) {
          this.users[index] = { ...this.selectedUser };
        }
        
        this.filterUsers();
        this.isEditing = false;
      } catch (error) {
        console.error('사용자 정보 저장 실패:', error);
      }
    },
    
    cancelEdit() {
      this.isEditing = false;
    },
    
    async activateUser(user) {
      try {
        // 실제 API 호출로 대체 필요
        user.status = '활성';
        
        // 목록 업데이트
        const index = this.users.findIndex(u => u.id === user.id);
        if (index !== -1) {
          this.users[index] = { ...user };
        }
        
        this.filterUsers();
      } catch (error) {
        console.error('사용자 활성화 실패:', error);
      }
    },
    
    async deactivateUser(user) {
      if (confirm('이 사용자를 비활성화하시겠습니까?')) {
        try {
          // 실제 API 호출로 대체 필요
          user.status = '비활성';
          
          // 목록 업데이트
          const index = this.users.findIndex(u => u.id === user.id);
          if (index !== -1) {
            this.users[index] = { ...user };
          }
          
          this.filterUsers();
        } catch (error) {
          console.error('사용자 비활성화 실패:', error);
        }
      }
    },
    
    async deleteUser(user) {
      if (confirm('이 사용자를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
        try {
          // 실제 API 호출로 대체 필요
          const index = this.users.findIndex(u => u.id === user.id);
          if (index !== -1) {
            this.users.splice(index, 1);
          }
          
          this.filterUsers();
          
          if (this.selectedUser && this.selectedUser.id === user.id) {
            this.closeModal();
          }
        } catch (error) {
          console.error('사용자 삭제 실패:', error);
        }
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
      const headers = ['ID', '이름', '이메일', '역할', '상태', '가입일', '마지막 로그인'];
      const rows = this.filteredUsers.map(user => [
        user.id,
        user.name,
        user.email,
        user.role,
        user.status,
        user.createdAt,
        user.lastLoginAt || '-'
      ]);
      
      return [headers, ...rows]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');
    },
    
    closeModal() {
      this.selectedUser = null;
      this.isEditing = false;
      this.editForm = {
        name: '',
        email: '',
        role: '',
        status: ''
      };
    },
    
    logout() {
      localStorage.clear();
      this.$router.push('/');
    }
  }
}
</script>

<style scoped>
.admin-layout {
  min-height: 100vh;
  background: #f8f9fa;
}

.user-management {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.logout-btn {
  background: #dc3545;
  color: white;
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.navigation-menu {
  display: flex;
  gap: 10px;
  margin-bottom: 30px;
  border-bottom: 1px solid #ddd;
  padding-bottom: 10px;
}

.nav-item {
  padding: 10px 20px;
  text-decoration: none;
  color: #666;
  border-radius: 4px;
  transition: all 0.3s;
}

.nav-item:hover {
  background: #f8f9fa;
  color: #333;
}

.nav-item.active {
  background: #007bff;
  color: white;
}



.filters {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
  align-items: center;
  flex-wrap: wrap;
}

.filters select, .filters input {
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.export-btn {
  background: #28a745;
  color: white;
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.user-table table {
  width: 100%;
  border-collapse: collapse;
}

.user-table th, .user-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #ddd;
}

.user-table th {
  background: #f8f9fa;
  font-weight: bold;
}

.role-admin {
  background: #dc3545;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.role-user {
  background: #6c757d;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.status-active {
  color: #28a745;
  font-weight: bold;
}

.status-inactive {
  color: #6c757d;
  font-weight: bold;
}

.status-suspended {
  color: #dc3545;
  font-weight: bold;
}

.view-btn, .edit-btn, .activate-btn, .deactivate-btn, .delete-btn {
  margin: 0 5px;
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.view-btn {
  background: #17a2b8;
  color: white;
}

.edit-btn {
  background: #ffc107;
  color: #212529;
}

.activate-btn {
  background: #28a745;
  color: white;
}

.deactivate-btn {
  background: #6c757d;
  color: white;
}

.delete-btn {
  background: #dc3545;
  color: white;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.5);
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal-content {
  background: white;
  width: 80%;
  max-width: 600px;
  max-height: 80%;
  overflow-y: auto;
  border-radius: 8px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #ddd;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
}

.modal-body {
  padding: 20px;
}

.user-detail p {
  margin: 10px 0;
}

.form-group {
  margin: 15px 0;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

.form-group input, .form-group select {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.form-actions, .modal-actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
  justify-content: flex-end;
}

.save-btn, .cancel-btn, .close-modal-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.save-btn {
  background: #28a745;
  color: white;
}

.cancel-btn, .close-modal-btn {
  background: #6c757d;
  color: white;
}
</style>
