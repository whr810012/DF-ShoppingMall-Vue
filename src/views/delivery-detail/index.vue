<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { Location, Phone, ArrowLeft, Timer } from '@element-plus/icons-vue'
import { onMounted, ref } from 'vue'
import axios from 'axios'

declare global {
  interface Window {
    AMap: any;
    _AMapSecurityConfig: {
      securityJsCode: string;
    };
  }
}

const route = useRoute()
const router = useRouter()
const mapContainer = ref<HTMLElement | null>(null)
const deliveryTime = ref<number>(0)
const deliveryDistance = ref<number>(0)
const navigationSteps = ref<string[]>([])

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

// 加载高德地图脚本
const loadAMap = () => {
  return new Promise((resolve, reject) => {
    if (window.AMap) {
      resolve(window.AMap)
      return
    }
    const script = document.createElement('script')
    script.type = 'text/javascript'
    script.async = true
    script.src = `https://webapi.amap.com/maps?v=2.0&key=a05ab04a5dbe61ad2fad7b664790a18f`
    script.onerror = reject
    script.onload = () => {
      resolve(window.AMap)
    }
    document.head.appendChild(script)
  })
}

// 初始化地图
const initMap = async () => {
  try {
    await loadAMap()
    const map = new window.AMap.Map(mapContainer.value, {
      zoom: 13,
      center: [Number(riderLng), Number(riderLat)]
    })

    // 添加骑手标记
    const riderMarker = new window.AMap.Marker({
      position: [Number(riderLng), Number(riderLat)],
      icon: 'https://webapi.amap.com/theme/v1.3/markers/n/mark_r.png',
      title: '骑手位置'
    })

    // 添加目标地址标记
    const addressMarker = new window.AMap.Marker({
      position: [Number(addressLng), Number(addressLat)],
      icon: 'https://webapi.amap.com/theme/v1.3/markers/n/mark_b.png',
      title: '配送地址'
    })

    map.add([riderMarker, addressMarker])

    // 发起骑行路径规划请求
    try {
      const response = await axios.get('https://restapi.amap.com/v4/direction/bicycling', {
        params: {
          key: 'ffdbb001fd0b4cc024456334e9aa6567',
          origin: `${riderLng},${riderLat}`,
          destination: `${addressLng},${addressLat}`
        }
      })

      if (response.data.errcode === 0 && response.data.data && response.data.data.paths) {
        const path = response.data.data.paths[0]
        
        // 更新配送时间和距离
        deliveryTime.value = Math.ceil(path.duration / 60)
        deliveryDistance.value = Number((path.distance / 1000).toFixed(1))

        // 保存导航步骤
        navigationSteps.value = path.steps.map((step: any) => step.instruction)

        // 绘制路线
        const pathCoordinates: number[][] = []
        path.steps.forEach((step: any) => {
          const points = step.polyline.split(';').map((point: string) => {
            const [lng, lat] = point.split(',')
            return [Number(lng), Number(lat)]
          })
          pathCoordinates.push(...points)
        })

        // 创建并添加路线
        const polyline = new window.AMap.Polyline({
          path: pathCoordinates,
          strokeColor: '#409EFF',
          strokeWeight: 8,
          strokeStyle: "dashed",
          strokeDasharray: [10, 5],
          lineJoin: 'round',
          lineCap: 'round',
          showDir: true,
          dirColor: '#409EFF',
          isOutline: true,
          outlineColor: '#ffffff',
          borderWeight: 2,
          strokeOpacity: 0.9,
          geodesic: true
        })

        // 添加文字标记
        const startText = new window.AMap.Text({
          text: `骑手位置\n${riderName}`,
          position: [Number(riderLng), Number(riderLat)],
          offset: new window.AMap.Pixel(0, -20),
          style: {
            'background-color': '#fff',
            'border-radius': '4px',
            'padding': '5px 10px',
            'border': '1px solid #409EFF',
            'box-shadow': '0 2px 6px rgba(0,0,0,0.1)',
            'text-align': 'center',
            'font-size': '12px',
            'white-space': 'nowrap',
            'z-index': 101
          }
        })

        const endText = new window.AMap.Text({
          text: `配送地址\n${addressDetail}`,
          position: [Number(addressLng), Number(addressLat)],
          offset: new window.AMap.Pixel(0, -20),
          style: {
            'background-color': '#fff',
            'border-radius': '4px',
            'padding': '5px 10px',
            'border': '1px solid #409EFF',
            'box-shadow': '0 2px 6px rgba(0,0,0,0.1)',
            'text-align': 'center',
            'font-size': '12px',
            'white-space': 'nowrap',
            'z-index': 101
          }
        })

        // 在路线中间添加距离提示
        const midIndex = Math.floor(pathCoordinates.length / 2)
        const midPoint = pathCoordinates[midIndex]
        const distanceText = new window.AMap.Text({
          text: `配送距离：${deliveryDistance.value}公里`,
          position: midPoint,
          offset: new window.AMap.Pixel(0, -15),
          style: {
            'background-color': '#409EFF',
            'color': '#fff',
            'border-radius': '15px',
            'padding': '3px 10px',
            'box-shadow': '0 2px 6px rgba(0,0,0,0.1)',
            'font-size': '12px'
          }
        })

        map.add([polyline, startText, endText, distanceText])

        // 添加路线动画效果
        polyline.on('addline', () => {
          polyline.moveAnimation({
            duration: 2000,
            delay: 500
          })
        })
      } else {
        console.error('骑行路径规划失败：', response.data)
      }
    } catch (error) {
      console.error('请求骑行路径失败：', error)
    }

    map.setFitView()
  } catch (error) {
    console.error('地图加载失败：', error)
  }
}

onMounted(() => {
  console.log(route.query)
  initMap()
})
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

      <div v-if="deliveryTime && deliveryDistance" class="delivery-status">
        <div class="status-item">
          <el-icon><Timer /></el-icon>
          <span>预计配送时间：{{ deliveryTime }}分钟</span>
        </div>
        <div class="status-item">
          <el-icon><Location /></el-icon>
          <span>配送距离：{{ deliveryDistance }}公里</span>
        </div>
      </div>
    </el-card>

    <el-card class="map-card">
      <div ref="mapContainer" class="map-container"></div>
      <div v-if="navigationSteps.length" class="navigation-steps">
        <h3>配送路线指引</h3>
        <ul>
          <li v-for="(step, index) in navigationSteps" :key="index">
            {{ step }}
          </li>
        </ul>
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
      margin-bottom: 20px;

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

    .delivery-status {
      display: flex;
      gap: 40px;
      padding-top: 16px;
      border-top: 1px solid #ebeef5;

      .status-item {
        display: flex;
        align-items: center;
        color: #606266;

        .el-icon {
          margin-right: 8px;
          font-size: 16px;
          color: #409EFF;
        }
      }
    }
  }

  .map-card {
    .map-container {
      width: 100%;
      height: 400px;
      margin-bottom: 20px;
    }

    .navigation-steps {
      padding: 16px;
      background-color: #f5f7fa;
      border-radius: 4px;

      h3 {
        margin: 0 0 16px 0;
        color: #303133;
        font-size: 16px;
      }

      ul {
        margin: 0;
        padding-left: 20px;
        
        li {
          color: #606266;
          margin-bottom: 8px;
          line-height: 1.5;

          &:last-child {
            margin-bottom: 0;
          }
        }
      }
    }
  }
}
</style> 