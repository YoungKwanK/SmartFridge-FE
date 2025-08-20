<template>
  <v-container>
    <v-row>
      <v-col>
        <v-card>
            <v-card-title class="text-center text-h5">
                알림
            </v-card-title>

            <!-- 카테고리 필터 버튼 -->
            <v-row >
              <v-col class="d-flex flex-row flex-wrap">
                <v-btn
                    v-for="category in categories"
                    :key="category"
                    :color="category === selectedCategory ? 'primary' : 'grey'"
                    @click="filterCategory(category)"
                    class="mx-1 my-1"
                    style="min-width: 100px;"
                >
                    {{ category }}
                </v-btn>
              </v-col>
              <v-col cols="2">
                <v-btn @click="readAll()" color="primary">모두 읽음</v-btn>
              </v-col>
            </v-row>

            <v-card-text>
                <v-table>
                <thead>
                    <tr>
                    <th>내용</th>
                    <th>타입</th>
                    <th>생성일</th>
                    <th>삭제</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="notification in sortedNotifications" 
                        :key="notification.id"
                        @click="goToDetail(notification)"
                        @mouseenter="hoveredId = notification.id"
                        @mouseleave="hoveredId = null"
                        :style="{ backgroundColor: notification.read ? 'white' : '#f0f0f0' }"
                        style="cursor: pointer;"
                    >
                        <td>{{ notification.content }}</td>
                        <td>{{ notification.type }}</td>
                        <td>{{ formatDate(notification.createdAt) }}</td>
                        <td>
                            <v-icon
                                icon
                                small
                                color="red"
                                @click.stop="confirmDelete(notification)"
                                v-if="hoveredId === notification.id"
                                >
                                mdi-close
                            </v-icon>
                        </td>
                    </tr>
                </tbody>
                </v-table>
            </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- 삭제 확인 모달 -->
    <v-dialog v-model="deleteDialog" max-width="400">
      <v-card>
        <v-card-title class="text-h6">알림 삭제</v-card-title>
        <v-card-text>정말 삭제하시겠습니까?</v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text color="red" @click="deleteNotification">삭제</v-btn>
          <v-btn text color="grey" @click="deleteDialog = false">취소</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

  </v-container>
</template>


<script>
    import axios from "axios";

export default {
  data() {
    return {
      notificationList: []
      , categories: ["ALL", "NEW_FOOD", "NEW_MEMBER", "NEW_INQUIRY"]
      , selectedCategory: "ALL"
      , fridgeId: 1 // 동적 할당할 것임
      , hoveredId: null
      , deleteDialog: false
      , deleteTarget: null
    };
  },
  async created() {
    await this.fetchNotifications();

    // // SSE 연결
    // this.eventSource = new EventSource(
    //   `${process.env.VUE_APP_API_BASE_URL}/sse/connect/notification`
    // );
    // this.eventSource.onmessage = (event) => {
    //   const newNotification = JSON.parse(event.data);
    //   this.notificationList.unshift(newNotification);
    // };
  }
  , computed: {
      sortedNotifications() {
        return [...this.notificationList].sort((a, b) => {
          // 1) 읽음 여부 우선순위 (false 먼저)
          if (a.read !== b.read) {
            return a.read ? 1 : -1
          }

          // 2) 같은 그룹이면 최신순 (createdAt 내림차순)
          return new Date(b.createdAt) - new Date(a.createdAt)
        })
      }
  }
  , methods: {
    async fetchNotifications() {
      let url = `${process.env.VUE_APP_API_BASE_URL}/fridge/${this.fridgeId}/notification/list`;
      if (this.selectedCategory !== "ALL") {
        url += `?notificationType=${this.selectedCategory}`;
      }
      const response = await axios.get(url);
      this.notificationList = response.data.result.content;
    }
    , filterCategory(category) {
        this.selectedCategory = category;
        this.fetchNotifications();
    }
    , async goToDetail(notification) {
        // 읽음 처리
          const readNotification = [{notificationId : notification.id}];
          console.log(readNotification);
          await axios.patch(`${process.env.VUE_APP_API_BASE_URL}/fridge/${this.fridgeId}/notification/isRead`, readNotification)
        // 알림 클릭 시 상세 페이지 이동
        if (notification.targetType === "ANNOUNCE") {
          this.$router.push(`/fridge/${this.fridgeId}/post/${notification.targetId}`);
          
        } else if (notification.targetType === "FOOD") {
          this.$router.push(`/food/${notification.targetId}`);
        }
    }
    , formatDate(dateStr) {
        const date = new Date(dateStr);
        const options = { weekday: 'short', year: 'numeric', month: '2-digit', day: '2-digit' };
        return date.toLocaleDateString('ko-KR', options); // 2025.08.19(화)
    }
    , confirmDelete(notification) {
        this.deleteTarget = notification;
        this.deleteDialog = true;
    }
    , async deleteNotification() {
        if (!this.deleteTarget) return;
        try {
            await axios.delete(`${process.env.VUE_APP_API_BASE_URL}/fridge/${this.fridgeId}/notification/delete/${this.deleteTarget.id}`);
            // 삭제 후 리스트 갱신
            this.notificationList = this.notificationList.filter(n => n.id !== this.deleteTarget.id);
            this.deleteDialog = false;
            this.deleteTarget = null;
        } catch (e) {
            console.error(e);
        }
    }
    , async readAll() {
        try {
          console.log(this.notificationList);
          
          const readNotification = this.notificationList.map(n => {return {
            notificationId : n.id
          }});
          console.log(readNotification);
          await axios.patch(`${process.env.VUE_APP_API_BASE_URL}/fridge/${this.fridgeId}/notification/isRead`, readNotification)
          window.location.reload();
        } catch (e) {
          console.log(e);
        }
        

    }
  }
  , beforeUnmount() {
      if (this.eventSource) {
        this.eventSource.close();
      }
  },
};
</script>