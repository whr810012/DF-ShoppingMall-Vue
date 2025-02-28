<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { getOrderListApi, refundOrderApi } from '@/api/order'
import { ElMessage } from 'element-plus'
import { User, Phone, Location, Van } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'

interface OrderDity {
  id: number
  orderId: number | null
  shopId: number
  name: string
  number: number
  price: number
  present: string | null
}

interface DityUrl {
  id: number
  dityId: number
  avatar: string
}

interface Address {
  id: number
  userId: number
  name: string
  address: string
  phone: string
  sex: string
  status: number
  ing: string  // 经度
  lat: string  // 纬度
}

interface Rider {
  id: number
  name: string
  phone: string
  sex: string
  avatar: string
  ing: string | null  // 经度
  lat: string | null  // 纬度
}

interface Order {
  id: number
  number: string
  status: number
  orderTime: string
  createTime: string
  updateTime: string | null
  amount: number
  price: number
  consignee: string
  phone: string
  address: Address
  userId: number
  addressId: number
  addressInfo: Address
  riderId: number | null
  rider: Rider | null
  orderDityList: OrderDity[]
  dityUrls: DityUrl[]
}

const tableData = ref<Order[]>([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

const router = useRouter()

// 计算当前页的数据
const currentTableData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return tableData.value.slice(start, end)
})

// 初始化获取订单列表
const init = async () => {
  try {
    const res = await getOrderListApi()
    console.log(res)
    if (res.data.code === 1) {
      tableData.value = res.data.data
      total.value = res.data.data.length
    } else {
      throw new Error(res.data.msg)
    }
  } catch (err) {
    console.error('请求出错了：', err)
    ElMessage.error('获取订单列表失败')
  }
}

// 处理页码改变
const handleCurrentChange = (val: number) => {
  currentPage.value = val
}

// 处理每页条数改变
const handleSizeChange = (val: number) => {
  pageSize.value = val
  currentPage.value = 1 // 重置到第一页
}

// 获取订单状态文本
const getOrderType = (status: number): string => {
  const statusMap: Record<number, string> = {
    0: '已取消',
    1: '已下单',
    2: '配送中',
    3: '已完成',
    4: '已申请退款'
  }
  return statusMap[status] || '未知状态'
}

// 获取订单状态样式
const getStatusStyle = (status: number): string => {
  const styleMap: Record<number, string> = {
    0: 'status-canceled',    // 灰色
    1: 'status-ordered',     // 蓝色
    2: 'status-delivering',  // 橙色
    3: 'status-completed',   // 绿色
    4: 'status-refunding'    // 红色
  }
  return styleMap[status] || ''
}

// 查看配送详情
const handleViewDelivery = (row: Order) => {
  if (!row.rider?.ing || !row.rider?.lat || !row.address?.ing || !row.address?.lat) {
    ElMessage.warning('暂无配送位置信息')
    return
  }

  router.push({
    path: '/delivery-detail',
    query: {
      orderId: row.id,
      riderLng: row.rider.ing,
      riderLat: row.rider.lat,
      addressLng: row.address.ing,
      addressLat: row.address.lat,
      riderName: row.rider.name,
      riderPhone: row.rider.phone,
      addressName: row.address.name,
      addressPhone: row.address.phone,
      addressDetail: row.address.address
    }
  })
}

// 同意退款
const handleAgreeRefund = (row: Order) => {
  refundOrderApi(row.id).then(res => {
    if (res.data.code === 1) {
      ElMessage.success('同意退款，订单号：' + row.id)
      init()
    } else {
      throw new Error(res.data.msg)
    }
  })
}

onMounted(() => {
  init()
})
</script>

<template>
  <div class="dashboard-container">
    <div class="container">
      <el-table v-if="tableData.length" :data="currentTableData" stripe class="tableBox">
        <el-table-column label="订单号" prop="id" width="100" />
        <el-table-column label="商品信息" min-width="400">
          <template #default="{ row }">
            <div class="goods-info">
              <div v-for="(item, index) in row.orderDityList" :key="index" class="goods-item">
                <el-image
                  class="goods-img"
                  :src="row.dityUrls.length ? row.dityUrls.find(url => url.dityId === item.shopId)?.avatar : row.seckills[0].phone"
                  :preview-src-list="[row.dityUrls.find(url => url.dityId === item.shopId)?.avatar]"
                />
                <div class="goods-detail">
                  <div class="goods-name">{{ item.name }}</div>
                  <div class="goods-price">
                    <span>￥{{ item.price }}</span>
                    <span class="goods-num">x{{ item.number }}</span>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="订单状态" width="100">
          <template #default="{ row }">
            <span :class="['status-tag', getStatusStyle(row.status)]">
              {{ getOrderType(row.status) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="收货信息" min-width="300">
          <template #default="{ row }">
            <div class="address-info">
              <div class="user-info">
                <el-icon><User /></el-icon>
                <span class="name">{{ row.address.name }}</span>
                <span class="sex-tag" :class="row.addressInfo?.sex === '1' ? 'male' : 'female'">
                  {{ row.address?.sex === '1' ? '先生' : '女士' }}
                </span>
              </div>
              <div class="phone-info">
                <el-icon><Phone /></el-icon>
                <span class="phone">{{ row.address.phone }}</span>
              </div>
              <div class="address-detail">
                <el-icon><Location /></el-icon>
                <span class="address">{{ row.address.address }}</span>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="配送信息" min-width="200" v-if="tableData.some(item => item.status === 2)">
          <template #default="{ row }">
            <div class="rider-info">
              <template v-if="row.rider && row.status === 2">
                <div class="rider-content">
                  <div class="rider-avatar">
                    <el-avatar :size="40" :src="row.rider.avatar" />
                    <div class="rider-status">配送中</div>
                  </div>
                  <div class="rider-detail">
                    <div class="rider-name">
                      {{ row.rider.name }}
                      <el-tag size="small" :type="row.rider.sex === '男' ? 'info' : 'danger'" class="rider-gender-tag">
                        {{ row.rider.sex }}
                      </el-tag>
                    </div>
                    <div class="rider-contact">
                      <el-icon><Phone /></el-icon>
                      <span class="rider-phone">{{ row.rider.phone }}</span>
                      <el-button type="primary" link size="small" class="contact-btn">
                        联系表哥
                      </el-button>
                    </div>
                  </div>
                </div>
              </template>
              <template v-else>
                <div class="no-rider">-</div>
              </template>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="下单时间" width="160" />
        <el-table-column prop="price" label="实收金额" width="120" align="right">
          <template #default="{ row }">
            <span class="price">￥{{ row.price.toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <div class="operation-column">
              <el-button
                v-if="row.status === 2"
                type="primary"
                link
                size="small"
                @click="handleViewDelivery(row)"
              >
                查看配送详情
              </el-button>
              <el-button
                v-if="row.status === 4"
                type="success"
                link
                size="small"
                @click="handleAgreeRefund(row)"
              >
                同意退款
              </el-button>
              <span v-if="row.status !== 2 && row.status !== 4" class="no-operation">-</span>
            </div>
          </template>
        </el-table-column>
      </el-table>
      <div v-if="tableData.length" class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 30, 50]"
          :total="total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
          layout="total, sizes, prev, pager, next, jumper"
          background
        />
      </div>
      <div v-else class="empty">
        <el-empty description="暂无订单数据" />
      </div>
    </div>
  </div>
</template>

<style lang="less" scoped>
.dashboard-container {
  margin: 30px;
  min-height: 700px;

  .container {
    background: #fff;
    padding: 30px 28px;
    border-radius: 4px;
    min-height: 500px;

    .status-tag {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 12px;
    }

    .status-canceled {
      background: #f5f5f5;
      color: #999;
    }

    .status-ordered {
      background: #e6f7ff;
      color: #1890ff;
    }

    .status-delivering {
      background: #fff7e6;
      color: #fa8c16;
    }

    .status-completed {
      background: #f6ffed;
      color: #52c41a;
    }

    .status-refunding {
      background: #fff1f0;
      color: #f5222d;
    }

    .tableBox {
      width: 100%;
      border: 1px solid #e4e4e4;
    }

    .empty {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 400px;
    }

    .goods-info {
      .goods-item {
        display: flex;
        align-items: center;
        padding: 8px 0;
        
        &:not(:last-child) {
          border-bottom: 1px solid #f0f0f0;
        }

        .goods-img {
          width: 60px;
          height: 60px;
          object-fit: cover;
          border-radius: 4px;
          margin-right: 12px;
        }

        .goods-detail {
          flex: 1;

          .goods-name {
            font-size: 14px;
            color: #333;
            margin-bottom: 8px;
          }

          .goods-price {
            color: #ff4d4f;
            font-size: 14px;

            .goods-num {
              margin-left: 12px;
              color: #999;
            }
          }
        }
      }
    }

    .price {
      color: #ff4d4f;
      font-weight: bold;
    }

    .address-info {
      padding: 8px;

      .user-info, .phone-info, .address-detail {
        display: flex;
        align-items: center;
        margin-bottom: 8px;
        
        .el-icon {
          margin-right: 8px;
          font-size: 16px;
          color: #909399;
        }
      }

      .user-info {
        .name {
          font-size: 15px;
          font-weight: 500;
          color: #303133;
          margin-right: 8px;
        }
        
        .sex-tag {
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 12px;
          
          &.male {
            background: #e6f7ff;
            color: #1890ff;
          }
          
          &.female {
            background: #fff0f6;
            color: #eb2f96;
          }
        }
      }
      
      .phone-info {
        .phone {
          color: #606266;
          font-size: 14px;
        }
      }
      
      .address-detail {
        .address {
          color: #606266;
          font-size: 14px;
          line-height: 1.4;
        }
      }
    }

    .rider-info {
      padding: 8px;
      background-color: #fafafa;
      border-radius: 8px;

      .rider-content {
        display: flex;
        align-items: flex-start;
        width: 100%;

        .rider-avatar {
          position: relative;
          margin-right: 16px;

          .rider-status {
            position: absolute;
            bottom: -4px;
            left: 50%;
            transform: translateX(-50%);
            background-color: #409EFF;
            color: #fff;
            font-size: 12px;
            padding: 2px 8px;
            border-radius: 10px;
            white-space: nowrap;
          }
        }

        .rider-detail {
          flex: 1;

          .rider-name {
            font-size: 15px;
            color: #303133;
            margin-bottom: 8px;
            display: flex;
            align-items: center;

            .rider-gender-tag {
              margin-left: 8px;
              font-size: 12px;
              padding: 0 8px;
              height: 20px;
              line-height: 18px;
            }
          }

          .rider-contact {
            display: flex;
            align-items: center;
            color: #606266;
            font-size: 14px;

            .el-icon {
              color: #909399;
              margin-right: 6px;
              font-size: 14px;
            }

            .rider-phone {
              color: #606266;
              margin-right: 12px;
            }

            .contact-btn {
              padding: 4px 0;
              font-size: 13px;
            }
          }
        }
      }
    }

    .no-rider {
      text-align: center;
      color: #909399;
      padding: 8px;
    }

    .pagination-container {
      margin-top: 20px;
      display: flex;
      justify-content: flex-end;
      padding: 10px 0;
    }

    .operation-column {
      display: flex;
      gap: 8px;
      justify-content: center;
      flex-wrap: wrap;

      .no-operation {
        color: #909399;
      }
    }
  }
}
</style>