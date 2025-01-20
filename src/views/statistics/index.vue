<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { getSortListApi } from '@/api/sort'
import { getGoodsListApi } from '@/api/goods'
import { getSeckillListApi } from '@/api/miaosha'
import { queryAllQiShouApi } from '@/api/qishou'
import { getUserListApi } from '@/api/user'
import { Goods, Timer, User } from '@element-plus/icons-vue'
import * as echarts from 'echarts'

interface CategoryData {
  total: number;
  categories: Array<{
    name: string;
    count: number;
  }>;
}

interface GoodsData {
  total: number;
  goods: Array<{
    name: string;
    price: number;
    number: number;
    status: number;
  }>;
}

interface SeckillData {
  total: number;
  seckills: Array<{
    name: string;
    price: number;
    number: number;
    status: number;
  }>;
}

interface RiderData {
  total: number;
  riders: Array<{
    name: string;
    phone: string;
    status: number;
  }>;
}

interface UserData {
  total: number;
  users: Array<{
    name: string;
    createTime: string;
  }>;
}

interface UserGrowthData {
  date: string;
  count: number;
}

const categoryData = ref<CategoryData>({
  total: 0,
  categories: []
})

const goodsData = ref<GoodsData>({
  total: 0,
  goods: []
})

const seckillData = ref<SeckillData>({
  total: 0,
  seckills: []
})

const riderData = ref<RiderData>({
  total: 0,
  riders: []
})

const userData = ref<UserData>({
  total: 0,
  users: []
})

const timeRanges = [
  { label: '全部', value: 'all' },
  { label: '近一年', value: 'year' },
  { label: '近一个月', value: 'month' },
  { label: '近七天', value: 'week' }
]

const selectedTimeRange = ref('all')
const userGrowthData = ref<UserGrowthData[]>([])
const filteredGrowthData = ref<UserGrowthData[]>([])

onMounted(() => {
  getCategoryData()
  getGoodsData()
  getSeckillData()
  getRiderData()
  getUserData()
})

// 获取分类统计数据
const getCategoryData = async () => {
  try {
    // 获取所有分类
    const { data: categoryRes } = await getSortListApi()
    // 获取所有商品
    const { data: goodsRes } = await getGoodsListApi()
    
    if (categoryRes.code === 1 && goodsRes.code === 1) {
      // 创建一个Map来存储每个分类的商品数量
      const categoryCountMap = new Map()
      
      // 初始化每个分类的商品数量为0
      categoryRes.data.forEach((category: any) => {
        categoryCountMap.set(category.id, {
          name: category.name,
          count: 0
        })
      })
      
      // 统计每个分类下的商品数量
      goodsRes.data.forEach((goods: any) => {
        if (goods.sortId && categoryCountMap.has(goods.sortId)) {
          const category = categoryCountMap.get(goods.sortId)
          category.count++
          categoryCountMap.set(goods.sortId, category)
        }
      })
      
      // 转换为数组格式
      categoryData.value = {
        total: categoryRes.data.length,
        categories: Array.from(categoryCountMap.values())
      }
      
      console.log('获取到分类统计数据：', categoryData.value)
    }
  } catch (error) {
    console.error('获取分类统计数据失败：', error)
  }
}

// 获取商品统计数据
const getGoodsData = async () => {
  try {
    const { data: res } = await getGoodsListApi()
    if (res.code === 1) {
      goodsData.value = {
        total: res.data.length,
        goods: res.data.map((item: any) => ({
          name: item.name,
          price: item.price,
          number: item.number || 0,
          status: item.status
        }))
      }
      console.log('获取到商品统计数据：', goodsData.value)
    }
  } catch (error) {
    console.error('获取商品统计数据失败：', error)
  }
}

// 获取秒杀商品统计数据
const getSeckillData = async () => {
  try {
    const { data: res } = await getSeckillListApi()
    if (res.code === 1) {
      seckillData.value = {
        total: res.data.length,
        seckills: res.data.map((item: any) => ({
          name: item.name,
          price: item.price,
          number: item.number,
          status: item.status
        }))
      }
      console.log('获取到秒杀商品统计数据：', seckillData.value)
    }
  } catch (error) {
    console.error('获取秒杀商品统计数据失败：', error)
  }
}

// 获取骑手统计数据
const getRiderData = async () => {
  try {
    const { data: res } = await queryAllQiShouApi()
    if (res.code === 1) {
      riderData.value = {
        total: res.data.length,
        riders: res.data.map((item: any) => ({
          name: item.name,
          phone: item.phone,
          status: item.status
        }))
      }
      console.log('获取到骑手统计数据：', riderData.value)
    }
  } catch (error) {
    console.error('获取骑手统计数据失败：', error)
  }
}

// 获取用户统计数据
const getUserData = async () => {
  try {
    const { data: res } = await getUserListApi()
    if (res.code === 1) {
      userData.value = {
        total: res.data.length,
        users: res.data.map((item: any) => ({
          name: item.name,
          createTime: item.createTime
        }))
      }
      
      // 处理用户增长数据
      const growthMap = new Map<string, number>()
      
      // 按日期分组统计
      res.data.forEach((user: any) => {
        const date = user.createTime.split(' ')[0]
        growthMap.set(date, (growthMap.get(date) || 0) + 1)
      })
      
      // 转换为数组并排序
      userGrowthData.value = Array.from(growthMap.entries())
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date))
      
      // 初始化过滤后的数据
      filterGrowthData()
      
      console.log('获取到用户统计数据：', userData.value)
    }
  } catch (error) {
    console.error('获取用户统计数据失败：', error)
  }
}

// 过滤增长数据
const filterGrowthData = () => {
  const now = new Date()
  const data = userGrowthData.value
  
  switch (selectedTimeRange.value) {
    case 'year': {
      const yearAgo = new Date(now.setFullYear(now.getFullYear() - 1))
      filteredGrowthData.value = data.filter(item => new Date(item.date) >= yearAgo)
      break
    }
    case 'month': {
      const monthAgo = new Date(now.setMonth(now.getMonth() - 1))
      filteredGrowthData.value = data.filter(item => new Date(item.date) >= monthAgo)
      break
    }
    case 'week': {
      const weekAgo = new Date(now.setDate(now.getDate() - 7))
      filteredGrowthData.value = data.filter(item => new Date(item.date) >= weekAgo)
      break
    }
    default:
      filteredGrowthData.value = data
  }
  
  // 更新图表
  updateChart()
}

// 更新图表
const updateChart = () => {
  const chartDom = document.getElementById('userGrowthChart')
  if (!chartDom) return
  
  const myChart = echarts.init(chartDom)
  
  const option = {
    title: {
      text: '用户增长趋势',
      left: 'center',
      top: '10px',
      textStyle: {
        color: '#303133',
        fontSize: 16,
        fontWeight: 500
      }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'line'
      }
    },
    grid: {
      top: '60px',
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: filteredGrowthData.value.map(item => item.date),
      axisLabel: {
        rotate: 45
      }
    },
    yAxis: {
      type: 'value',
      name: '新增用户数',
      minInterval: 1
    },
    series: [
      {
        name: '新增用户',
        type: 'line',
        data: filteredGrowthData.value.map(item => item.count),
        smooth: true,
        showSymbol: true,
        symbolSize: 8,
        lineStyle: {
          width: 3,
          color: '#409EFF'
        },
        itemStyle: {
          color: '#409EFF'
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            {
              offset: 0,
              color: 'rgba(64,158,255,0.3)'
            },
            {
              offset: 1,
              color: 'rgba(64,158,255,0.1)'
            }
          ])
        }
      }
    ]
  }
  
  myChart.setOption(option)
  
  // 监听窗口大小变化，调整图表大小
  window.addEventListener('resize', () => {
    myChart.resize()
  })
}

// 监听时间范围变化
const handleTimeRangeChange = (value: string) => {
  selectedTimeRange.value = value
  filterGrowthData()
}
</script>

<template>
  <div class="statistics-container">
    <el-row :gutter="20" class="overview-row">
      <el-col :span="6">
        <el-card class="overview-card" shadow="hover">
          <div class="overview-item">
            <div class="icon-wrapper bg-success">
              <el-icon><Goods /></el-icon>
            </div>
            <div class="content">
              <div class="label">在售商品</div>
              <div class="value">{{ goodsData.goods.filter(item => item.status === 1).length }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="overview-card" shadow="hover">
          <div class="overview-item">
            <div class="icon-wrapper bg-warning">
              <el-icon><Timer /></el-icon>
            </div>
            <div class="content">
              <div class="label">秒杀商品</div>
              <div class="value">{{ seckillData.seckills.filter(item => item.status === 1).length }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="overview-card" shadow="hover">
          <div class="overview-item">
            <div class="icon-wrapper bg-primary">
              <el-icon><User /></el-icon>
            </div>
            <div class="content">
              <div class="label">空闲骑手</div>
              <div class="value">{{ riderData.riders.filter(item => item.status === 1).length }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="overview-card" shadow="hover">
          <div class="overview-item">
            <div class="icon-wrapper bg-info">
              <el-icon><User /></el-icon>
            </div>
            <div class="content">
              <div class="label">平台用户</div>
              <div class="value">{{ userData.total }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="12">
        <div class="stats-card category-stats">
          <el-card class="box-card" shadow="hover">
            <template #header>
              <div class="card-header">
                <span class="title">分类统计</span>
                <el-tag type="info" effect="plain" class="total-tag">
                  总数：{{ categoryData.total }}
                </el-tag>
              </div>
            </template>
            <el-table 
              :data="categoryData.categories" 
              style="width: 100%"
              :header-cell-style="{
                background: '#f5f7fa',
                color: '#606266',
                fontWeight: 'bold'
              }"
              :cell-style="{
                padding: '8px 0'
              }"
              height="400"
              :max-height="400"
            >
              <el-table-column prop="name" label="分类名称" min-width="120" />
              <el-table-column prop="count" label="商品数量" align="center" width="100" />
            </el-table>
          </el-card>
        </div>
      </el-col>
      <el-col :span="12">
        <div class="stats-card goods-stats">
          <el-card class="box-card" shadow="hover">
            <template #header>
              <div class="card-header">
                <span class="title">商品统计</span>
                <el-tag type="info" effect="plain" class="total-tag">
                  总数：{{ goodsData.total }}
                </el-tag>
              </div>
            </template>
            <el-table 
              :data="goodsData.goods" 
              style="width: 100%"
              :header-cell-style="{
                background: '#f5f7fa',
                color: '#606266',
                fontWeight: 'bold'
              }"
              :cell-style="{
                padding: '8px 0'
              }"
              height="400"
              :max-height="400"
            >
              <el-table-column prop="name" label="商品名称" min-width="120" />
              <el-table-column prop="price" label="价格" align="center" width="100">
                <template #default="scope">
                  <span class="price">{{ scope.row.price }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="number" label="库存" align="center" width="80" />
              <el-table-column prop="status" label="状态" align="center" width="80">
                <template #default="scope">
                  <el-tag 
                    :type="scope.row.status === 1 ? 'success' : 'info'"
                    effect="light"
                    size="small"
                  >
                    {{ scope.row.status === 1 ? '上架' : '下架' }}
                  </el-tag>
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </div>
      </el-col>
    </el-row>
    <el-row :gutter="20">
      <el-col :span="12">
        <div class="stats-card seckill-stats">
          <el-card class="box-card" shadow="hover">
            <template #header>
              <div class="card-header">
                <span class="title">秒杀商品统计</span>
                <el-tag type="info" effect="plain" class="total-tag">
                  总数：{{ seckillData.total }}
                </el-tag>
              </div>
            </template>
            <el-table 
              :data="seckillData.seckills" 
              style="width: 100%"
              :header-cell-style="{
                background: '#f5f7fa',
                color: '#606266',
                fontWeight: 'bold'
              }"
              :cell-style="{
                padding: '8px 0'
              }"
              height="400"
              :max-height="400"
            >
              <el-table-column prop="name" label="商品名称" min-width="120" />
              <el-table-column prop="price" label="价格" align="center" width="100">
                <template #default="scope">
                  <span class="price">{{ scope.row.price }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="number" label="库存" align="center" width="80" />
              <el-table-column prop="status" label="状态" align="center" width="80">
                <template #default="scope">
                  <el-tag 
                    :type="scope.row.status === 1 ? 'success' : 'info'"
                    effect="light"
                    size="small"
                  >
                    {{ scope.row.status === 1 ? '进行中' : '已结束' }}
                  </el-tag>
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </div>
      </el-col>
      <el-col :span="12">
        <div class="stats-card rider-stats">
          <el-card class="box-card" shadow="hover">
            <template #header>
              <div class="card-header">
                <span class="title">骑手统计</span>
                <el-tag type="info" effect="plain" class="total-tag">
                  总数：{{ riderData.total }}
                </el-tag>
              </div>
            </template>
            <el-table 
              :data="riderData.riders" 
              style="width: 100%"
              :header-cell-style="{
                background: '#f5f7fa',
                color: '#606266',
                fontWeight: 'bold'
              }"
              :cell-style="{
                padding: '8px 0'
              }"
              height="400"
              :max-height="400"
            >
              <el-table-column prop="name" label="骑手姓名" min-width="100" />
              <el-table-column prop="phone" label="联系电话" min-width="120" align="center" />
              <el-table-column prop="status" label="状态" align="center" width="100">
                <template #default="scope">
                  <el-tag 
                    :type="scope.row.status === 1 ? 'success' : 'warning'"
                    effect="light"
                    size="small"
                  >
                    {{ scope.row.status === 1 ? '空闲' : '进行中' }}
                  </el-tag>
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </div>
      </el-col>
    </el-row>
    <el-row :gutter="20">
      <el-col :span="12">
        <div class="stats-card user-stats">
          <el-card class="box-card" shadow="hover">
            <template #header>
              <div class="card-header">
                <span class="title">用户统计</span>
                <el-tag type="info" effect="plain" class="total-tag">
                  总数：{{ userData.total }}
                </el-tag>
              </div>
            </template>
            <el-table 
              :data="userData.users" 
              style="width: 100%"
              :header-cell-style="{
                background: '#f5f7fa',
                color: '#606266',
                fontWeight: 'bold'
              }"
              :cell-style="{
                padding: '8px 0'
              }"
              height="400"
              :max-height="400"
            >
              <el-table-column prop="name" label="用户名称" min-width="150">
                <template #default="scope">
                  {{ scope.row.name || '微信用户' }}
                </template>
              </el-table-column>
              <el-table-column prop="createTime" label="创建时间" min-width="180" align="center" />
            </el-table>
          </el-card>
        </div>
      </el-col>
    </el-row>
    <el-row :gutter="20">
      <el-col :span="24">
        <div class="stats-card growth-stats">
          <el-card class="box-card" shadow="hover">
            <template #header>
              <div class="card-header">
                <span class="title">用户增长趋势</span>
                <el-radio-group 
                  v-model="selectedTimeRange" 
                  @change="handleTimeRangeChange"
                  size="small"
                >
                  <el-radio-button 
                    v-for="range in timeRanges" 
                    :key="range.value" 
                    :label="range.value"
                  >
                    {{ range.label }}
                  </el-radio-button>
                </el-radio-group>
              </div>
            </template>
            <div id="userGrowthChart" style="width: 100%; height: 400px;"></div>
          </el-card>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<style lang="less" scoped>
.statistics-container {
  padding: 20px;
  min-height: calc(100vh - 100px);
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e7ed 100%);
  animation: fadeIn 0.5s ease-out;

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .overview-row {
    margin-bottom: 30px;

    .overview-card {
      border-radius: 15px;
      overflow: hidden;
      border: none;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

      &:hover {
        transform: translateY(-5px);
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);

        .icon-wrapper {
          transform: scale(1.1);
        }

        .value {
          color: var(--el-color-primary);
        }
      }

      .overview-item {
        display: flex;
        align-items: center;
        padding: 20px;
        background: white;

        .icon-wrapper {
          width: 60px;
          height: 60px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 20px;
          transition: all 0.3s ease;

          .el-icon {
            font-size: 28px;
            color: #fff;
          }
        }

        .content {
          flex: 1;

          .label {
            font-size: 16px;
            color: #606266;
            margin-bottom: 8px;
            font-weight: 500;
          }

          .value {
            font-size: 28px;
            font-weight: bold;
            background: linear-gradient(45deg, #303133, #606266);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            transition: all 0.3s ease;
          }
        }
      }
    }

    .bg-success {
      background: linear-gradient(135deg, #67c23a 0%, #85ce61 100%);
    }

    .bg-warning {
      background: linear-gradient(135deg, #e6a23c 0%, #f3d19e 100%);
    }

    .bg-primary {
      background: linear-gradient(135deg, #409eff 0%, #a0cfff 100%);
    }

    .bg-info {
      background: linear-gradient(135deg, #909399 0%, #c8c9cc 100%);
    }
  }

  .el-row {
    & + .el-row {
      margin-top: 30px;
    }
  }

  .stats-card {
    .box-card {
      height: 100%;
      border-radius: 15px;
      border: none;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      overflow: hidden;
      
      &:hover {
        transform: translateY(-5px);
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
      }

      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: linear-gradient(to right, #f5f7fa, #ffffff);
        padding: 15px 20px;
        
        .title {
          font-size: 18px;
          font-weight: bold;
          color: #303133;
          position: relative;
          padding-left: 12px;

          &::before {
            content: '';
            position: absolute;
            left: 0;
            top: 50%;
            transform: translateY(-50%);
            width: 4px;
            height: 16px;
            background: var(--el-color-primary);
            border-radius: 2px;
          }
        }

        .total-tag {
          border-radius: 20px;
          padding: 6px 12px;
          font-weight: normal;
          background: #f5f7fa;
          border: none;
          box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.05);
        }
      }

      :deep(.el-card__body) {
        padding: 20px;
      }

      :deep(.el-table) {
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);

        th {
          background: #f5f7fa !important;
          font-weight: bold;
          font-size: 14px;
          color: #606266;
          height: 50px;
        }

        td {
          padding: 12px 0;
          transition: all 0.3s;
        }

        tr:hover td {
          background-color: #f5f7fa !important;
        }

        .el-tag {
          border-radius: 12px;
          padding: 2px 10px;
          font-weight: 500;
          transition: all 0.3s;

          &:hover {
            transform: scale(1.05);
          }
        }

        // 自定义滚动条样式
        .el-scrollbar__wrap {
          overflow-x: hidden;
        }

        .el-scrollbar__bar.is-vertical {
          width: 6px;
        }

        .el-scrollbar__thumb {
          background-color: #909399;
          opacity: 0.3;
          border-radius: 3px;

          &:hover {
            opacity: 0.5;
          }
        }
      }

      .price {
        color: #f56c6c;
        font-weight: bold;
        font-size: 15px;
        
        &::before {
          content: '¥';
          font-size: 12px;
          margin-right: 2px;
        }
      }

      &.growth-stats {
        margin-top: 20px;
      }
    }
  }
}

// 响应式布局
@media screen and (max-width: 1200px) {
  .statistics-container {
    .el-col {
      width: 100% !important;
      margin-bottom: 20px;

      &:last-child {
        margin-bottom: 0;
      }
    }

    .overview-card {
      margin-bottom: 15px;
    }
  }
}

// 添加暗色主题支持
:root[class~="dark"] {
  .statistics-container {
    background: linear-gradient(135deg, #1a1a1a 0%, #2c2c2c 100%);

    .overview-card,
    .box-card {
      background-color: #2c2c2c;
      
      .card-header {
        background: linear-gradient(to right, #2c2c2c, #363636);
        
        .title {
          color: #e5e5e5;
        }
      }

      :deep(.el-table) {
        background-color: #2c2c2c;
        
        th {
          background-color: #363636 !important;
          color: #e5e5e5;
        }

        td {
          background-color: #2c2c2c;
          color: #e5e5e5;
        }

        tr:hover td {
          background-color: #363636 !important;
        }

        // 暗色主题下的滚动条样式
        .el-scrollbar__thumb {
          background-color: #909399;
          opacity: 0.5;

          &:hover {
            opacity: 0.7;
          }
        }
      }
    }
  }
}
</style>