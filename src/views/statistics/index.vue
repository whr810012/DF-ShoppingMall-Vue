<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { getSortListApi } from '@/api/sort'
import { getGoodsListApi } from '@/api/goods'
import { getSeckillListApi } from '@/api/miaosha'
import { queryAllQiShouApi } from '@/api/qishou'
import { Goods, Timer, User } from '@element-plus/icons-vue'

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

onMounted(() => {
  getCategoryData()
  getGoodsData()
  getSeckillData()
  getRiderData()
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
</script>

<template>
  <div class="statistics-container">
    <el-row :gutter="20" class="overview-row">
      <el-col :span="8">
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
      <el-col :span="8">
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
      <el-col :span="8">
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