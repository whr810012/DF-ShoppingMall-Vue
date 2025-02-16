<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { Location, Phone, ArrowLeft } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()

// 获取路由参数
const {
  orderId,
  riderLng,
  riderLat,
  addressLng,
  addressLat,
  riderName,
  riderPhone,
  addressName,
  addressPhone,
  addressDetail
} = route.query

// 返回订单列表
const goBack = () => {
  router.push('/order')
}
</script>

<template>
  <div class="delivery-detail">
    <div class="header">
      <el-button @click="goBack" link type="primary">
        <el-icon><ArrowLeft /></el-icon>
        返回订单列表
      </el-button>
      <h2>配送详情</h2>
    </div>

    <el-card class="info-card">
      <div class="delivery-info">
        <div class="info-section rider-section">
          <h3>骑手信息</h3>
          <div class="info-content">
            <div class="info-item">
              <el-icon><Location /></el-icon>
              <span>当前位置：{{ riderLng }}, {{ riderLat }}</span>
            </div>
            <div class="info-item">
              <el-icon><Phone /></el-icon>
              <span>{{ riderName }} {{ riderPhone }}</span>
            </div>
          </div>
        </div>

        <div class="info-section address-section">
          <h3>收货信息</h3>
          <div class="info-content">
            <div class="info-item">
              <el-icon><Location /></el-icon>
              <span>{{ addressDetail }}</span>
            </div>
            <div class="info-item">
              <el-icon><Phone /></el-icon>
              <span>{{ addressName }} {{ addressPhone }}</span>
            </div>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<style lang="less" scoped>
.delivery-detail {
  padding: 20px;

  .header {
    display: flex;
    align-items: center;
    margin-bottom: 20px;
    gap: 16px;

    h2 {
      margin: 0;
      color: #303133;
    }
  }

  .info-card {
    margin-bottom: 20px;

    .delivery-info {
      display: flex;
      gap: 40px;

      .info-section {
        flex: 1;

        h3 {
          margin: 0 0 16px 0;
          color: #303133;
          font-size: 16px;
        }

        .info-content {
          .info-item {
            display: flex;
            align-items: center;
            margin-bottom: 12px;
            color: #606266;

            .el-icon {
              margin-right: 8px;
              font-size: 16px;
              color: #909399;
            }
          }
        }
      }
    }
  }
}
</style> 