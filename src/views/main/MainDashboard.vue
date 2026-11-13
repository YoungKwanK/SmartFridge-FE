<template>
  <div class="landing">
    <header class="top-bar">
      <span class="sf-brand">
        <img :src="logoUrl" alt="" class="sf-brand-logo" />
        <span class="sf-brand-name">SmartFridge</span>
      </span>
      <v-btn to="/login" variant="text">로그인</v-btn>
    </header>

    <!-- 첫 화면: 서비스가 실제로 보여주는 화면 -->
    <section class="hero" aria-labelledby="hero-title">
      <div class="hero-text">
        <h1 id="hero-title" class="hero-title">
          같이 쓰는 냉장고,<br>누구 건지 언제까지인지<br>한눈에 보여요
        </h1>
        <p class="hero-desc">
          기숙사, 셰어하우스, 사무실처럼 여럿이 쓰는 냉장고를 위한 서비스예요.
          넣을 때 이름과 유통기한을 남기면 곧 상하는 것부터 알려드려요.
        </p>
        <v-btn to="/login" color="primary" variant="flat" size="x-large" class="hero-cta">
          시작하기
        </v-btn>
      </div>

      <div class="hero-sample" aria-label="오늘 확인할 식품 예시">
        <p class="sample-title">먼저 확인할 식품 <span class="sf-num">3</span></p>
        <ul class="sample-list">
          <FoodRow v-for="food in sampleFoods" :key="food.id" :food="food" show-shared />
        </ul>
      </div>
    </section>

    <!-- 사용 순서 (실제 순서라 번호를 붙인다) -->
    <section class="steps" aria-labelledby="steps-title">
      <h2 id="steps-title" class="section-title">이렇게 써요</h2>
      <ol class="step-list">
        <li v-for="(step, index) in steps" :key="step.title" class="step">
          <span class="step-num sf-num" aria-hidden="true">{{ index + 1 }}</span>
          <h3 class="step-title">{{ step.title }}</h3>
          <p class="step-desc">{{ step.description }}</p>
        </li>
      </ol>
    </section>

    <!-- 기능: 아이콘 대신 실제 화면 조각으로 -->
    <section class="features" aria-labelledby="features-title">
      <h2 id="features-title" class="section-title">냉장고 하나로 할 수 있는 일</h2>

      <div class="feature">
        <div class="feature-text">
          <h3 class="feature-title">상하기 전에 알려줘요</h3>
          <p class="feature-desc">
            유통기한이 3일 안으로 남으면 노란색, 지나면 빨간색으로 표시하고 알림을 보내요.
            신선한 식품은 조용히 둬서 확인할 것만 눈에 띄어요.
          </p>
        </div>
        <div class="feature-demo badges-demo" aria-hidden="true">
          <span class="demo-row"><span class="demo-name">요거트</span><DdayBadge :expiration-date-time="day(9)" /></span>
          <span class="demo-row"><span class="demo-name">계란</span><DdayBadge :expiration-date-time="day(2)" /></span>
          <span class="demo-row"><span class="demo-name">우유</span><DdayBadge :expiration-date-time="day(-1)" /></span>
        </div>
      </div>

      <div class="feature">
        <div class="feature-text">
          <h3 class="feature-title">남는 건 나눠 먹어요</h3>
          <p class="feature-desc">
            식품을 공유식품으로 등록하면 멤버 누구나 가져갈 수 있어요.
            다 먹었는지, 버렸는지도 기록이 남아요.
          </p>
        </div>
        <div class="feature-demo" aria-hidden="true">
          <ul class="sample-list">
            <FoodRow :food="sharedSample" show-shared />
          </ul>
        </div>
      </div>

      <div class="feature">
        <div class="feature-text">
          <h3 class="feature-title">필요한 건 같이 사요</h3>
          <p class="feature-desc">
            공동구매 글을 올리면 참여자 채팅방이 함께 열려요.
            대용량 식재료를 나눠 사고 냉장고에 함께 넣어요.
          </p>
        </div>
        <div class="feature-demo groupbuy-demo" aria-hidden="true">
          <span class="groupbuy-icon"><v-icon size="20">mdi-cart-outline</v-icon></span>
          <span class="groupbuy-text">
            <span class="groupbuy-title">코스트코 계란 30구 나눠 사실 분</span>
            <span class="groupbuy-meta">307호 준호, 20분 전</span>
          </span>
          <span class="groupbuy-btn">참여하기</span>
        </div>
      </div>
    </section>

    <section class="closing">
      <h2 class="closing-title">우리 냉장고부터 정리해 볼까요?</h2>
      <p class="closing-desc">냉장고를 만들고 초대 링크를 보내면 바로 함께 쓸 수 있어요.</p>
      <v-btn to="/login" color="primary" variant="flat" size="x-large">시작하기</v-btn>
    </section>
  </div>
</template>

<script setup>
import FoodRow from '@/components/food/FoodRow.vue';
import DdayBadge from '@/components/food/DdayBadge.vue';
import logoUrl from '@/assets/images/SFlogo/smartFridge_logo.png';

// 예시 날짜는 오늘 기준으로 만든다
const day = (days, hour = 21) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
};

const sampleFoods = [
  { id: 1, name: '우유 1L', registeredName: '305호 민지', quantity: 1, category: '유제품', storageType: '냉장', shareable: false, expirationDateTime: day(-1) },
  { id: 2, name: '두부', registeredName: '307호 준호', quantity: 2, category: '가공식품', storageType: '냉장', shareable: true, expirationDateTime: day(0, 23) },
  { id: 3, name: '시금치 한 단', registeredName: '310호 서연', quantity: 1, category: '채소', storageType: '냉장', shareable: false, expirationDateTime: day(2) }
];

const sharedSample = { id: 9, name: '제주 감귤', registeredName: '308호 하은', quantity: 12, category: '과일', storageType: '냉장', shareable: true, expirationDateTime: day(10) };

const steps = [
  { title: '냉장고를 만들어요', description: '냉장고 이름을 정하고 초대 링크를 함께 쓰는 사람들에게 보내요.' },
  { title: '넣을 때 등록해요', description: '식품 이름, 수량, 유통기한을 적고 혼자 먹을지 나눠 먹을지 골라요.' },
  { title: '알림을 받고 정리해요', description: '곧 상하는 식품을 알려드려요. 다 먹었거나 버린 식품은 목록에서 정리해요.' }
];
</script>

<style scoped>
.landing {
  min-height: 100vh;
  background: var(--sf-bg);
  padding: 20px clamp(16px, 4vw, 56px) 64px;
}

.landing > * {
  max-width: 1120px;
  margin-left: auto;
  margin-right: auto;
}

.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

/* 첫 화면 */
.hero {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(320px, 1fr);
  gap: clamp(32px, 6vw, 80px);
  align-items: center;
  padding: clamp(40px, 10vh, 112px) 0 clamp(48px, 10vh, 120px);
}

.hero-title {
  margin: 0;
  font-size: clamp(34px, 4.6vw, 54px);
  font-weight: 800;
  line-height: 1.18;
  letter-spacing: -0.04em;
  color: var(--sf-text);
}

.hero-desc {
  max-width: 32em;
  margin: 20px 0 32px;
  font-size: 18px;
  line-height: 1.7;
  color: var(--sf-text-sub);
}

.hero-sample {
  padding: 24px 24px 12px;
  border-radius: var(--sf-radius-lg);
  background: var(--sf-surface);
  border-left: 4px solid var(--sf-soon);
  box-shadow: var(--sf-shadow);
}

.sample-title {
  margin: 0 0 4px;
  font-size: 18px;
  font-weight: 700;
  color: var(--sf-text);
}

.sample-list {
  margin: 0;
  padding: 0;
}

.section-title {
  margin: 0 0 28px;
  font-size: clamp(24px, 2.6vw, 30px);
  font-weight: 800;
  letter-spacing: -0.03em;
  color: var(--sf-text);
}

/* 사용 순서 */
.steps {
  padding: 56px 0;
  border-top: 1px solid var(--sf-line-strong);
}

.step-list {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 32px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.step-num {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--sf-text);
  font-size: 15px;
  font-weight: 700;
  color: #fff;
}

.step-title {
  margin: 16px 0 8px;
  font-size: 19px;
  font-weight: 700;
  color: var(--sf-text);
}

.step-desc {
  margin: 0;
  font-size: 15px;
  line-height: 1.7;
  color: var(--sf-text-sub);
}

/* 기능 */
.features {
  padding: 56px 0;
  border-top: 1px solid var(--sf-line-strong);
}

.feature {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(280px, 440px);
  gap: clamp(24px, 5vw, 72px);
  align-items: center;
  padding: 28px 0;
}

.feature + .feature {
  border-top: 1px solid var(--sf-line);
}

.feature-title {
  margin: 0 0 10px;
  font-size: 21px;
  font-weight: 700;
  color: var(--sf-text);
}

.feature-desc {
  max-width: 30em;
  margin: 0;
  font-size: 16px;
  line-height: 1.7;
  color: var(--sf-text-sub);
}

.feature-demo {
  padding: 16px 20px;
  border-radius: var(--sf-radius-lg);
  background: var(--sf-surface);
  box-shadow: var(--sf-shadow);
}

.badges-demo {
  display: flex;
  flex-direction: column;
}

.demo-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 0;
  font-size: 15px;
  font-weight: 600;
  color: var(--sf-text);
}

.demo-row + .demo-row {
  border-top: 1px solid var(--sf-line);
}

.groupbuy-demo {
  display: grid;
  grid-template-columns: 40px minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
}

.groupbuy-icon {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: #FFF0E6;
  color: #C2501A;
}

.groupbuy-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.groupbuy-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--sf-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.groupbuy-meta {
  font-size: 13px;
  color: var(--sf-text-faint);
}

.groupbuy-btn {
  padding: 8px 14px;
  border-radius: var(--sf-radius-sm);
  background: var(--sf-cta);
  font-size: 14px;
  font-weight: 700;
  color: var(--sf-cta-ink);
}

/* 마무리 */
.closing {
  padding: 64px 32px;
  border-radius: var(--sf-radius-lg);
  background: var(--sf-surface);
  box-shadow: var(--sf-shadow);
  text-align: center;
}

.closing-title {
  margin: 0;
  font-size: clamp(24px, 2.8vw, 32px);
  font-weight: 800;
  letter-spacing: -0.03em;
  color: var(--sf-text);
}

.closing-desc {
  margin: 12px 0 28px;
  font-size: 16px;
  color: var(--sf-text-sub);
}

@media (max-width: 900px) {
  .hero,
  .feature {
    grid-template-columns: minmax(0, 1fr);
  }

  .step-list {
    grid-template-columns: minmax(0, 1fr);
    gap: 24px;
  }
}

@media (max-width: 600px) {
  .landing {
    padding: 16px 16px 40px;
  }

  .hero-desc {
    font-size: 16px;
  }

  .hero-cta {
    width: 100%;
  }

  .closing {
    padding: 40px 20px;
  }
}
</style>
