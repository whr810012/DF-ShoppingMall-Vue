<template>
  <div class="dashboard-container">
    <!-- 骑手统计概览 -->
    <div class="container overview">
      <ul class="data-overview">
        <li>
          <div class="title">总骑手数</div>
          <div class="number">{{ statistics.total }}</div>
        </li>
        <li>
          <div class="title">在线骑手</div>
          <div class="number">{{ statistics.online }}</div>
        </li>
        <li>
          <div class="title">配送中</div>
          <div class="number">{{ statistics.delivering }}</div>
        </li>
        <li>
          <div class="title">休息中</div>
          <div class="number">{{ statistics.resting }}</div>
        </li>
      </ul>
    </div>

    <!-- 骑手列表 -->
    <div class="container">
      <div class="table-header">
        <div class="left">
          <el-button type="primary" @click="handleAdd">新增骑手</el-button>
        </div>
        <div class="right">
          <el-input
            v-model="searchQuery"
            placeholder="请输入骑手姓名/手机号"
            clearable
            @clear="handleSearch"
            style="width: 300px"
          >
            <template #append>
              <el-button @click="handleSearch">
                <el-icon><Search /></el-icon>
              </el-button>
            </template>
          </el-input>
        </div>
      </div>

      <el-table :data="riderList" style="width: 100%" v-loading="loading">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="姓名" width="120" />
        <el-table-column prop="phone" label="手机号" width="120" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.status)">
              {{ getStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="orderCount" label="今日订单" width="100" />
        <el-table-column prop="rating" label="评分" width="100">
          <template #default="scope">
            <el-rate v-model="scope.row.rating" disabled text-color="#ff9900" />
          </template>
        </el-table-column>
        <el-table-column label="操作">
          <template #default="scope">
            <el-button 
              type="primary" 
              size="small" 
              @click="handleAssignOrder(scope.row)"
              :disabled="scope.row.status !== 1"
            >
              分配订单
            </el-button>
            <el-button 
              type="danger" 
              size="small" 
              @click="handleDelete(scope.row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="total"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        layout="total, sizes, prev, pager, next"
        class="pagination"
      />
    </div>

    <!-- 新增/编辑骑手对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'add' ? '新增骑手' : '编辑骑手'"
      width="500px"
    >
      <el-form :model="riderForm" :rules="rules" ref="riderFormRef" label-width="100px">
        <el-form-item label="姓名" prop="name">
          <el-input v-model="riderForm.name" />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="riderForm.phone" />
        </el-form-item>
        <el-form-item label="身份证号" prop="idCard">
          <el-input v-model="riderForm.idCard" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitRiderForm">确定</el-button>
      </template>
    </el-dialog>

    <!-- 分配订单对话框 -->
    <el-dialog
      v-model="orderDialogVisible"
      title="分配订单"
      width="600px"
    >
      <el-table :data="pendingOrders" style="width: 100%" v-loading="orderLoading">
        <el-table-column prop="id" label="订单号" width="120" />
        <el-table-column prop="address" label="配送地址" />
        <el-table-column prop="distance" label="距离" width="100" />
        <el-table-column label="操作" width="100">
          <template #default="scope">
            <el-button 
              type="primary" 
              size="small" 
              @click="assignOrder(scope.row)"
            >
              分配
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'

// 统计数据
const statistics = ref({
  total: 0,
  online: 0,
  delivering: 0,
  resting: 0
})

// 表格数据
const loading = ref(false)
const riderList = ref([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const searchQuery = ref('')

// 表单数据
const dialogVisible = ref(false)
const dialogType = ref<'add' | 'edit'>('add')
const riderFormRef = ref<FormInstance>()
const riderForm = ref({
  name: '',
  phone: '',
  idCard: ''
})

// 订单分配
const orderDialogVisible = ref(false)
const orderLoading = ref(false)
const pendingOrders = ref([])
const currentRider = ref<any>(null)

// 表单校验规则
const rules = {
  name: [
    { required: true, message: '请输入姓名', trigger: 'blur' },
    { min: 2, max: 10, message: '长度在 2 到 10 个字符', trigger: 'blur' }
  ],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ],
  idCard: [
    { required: true, message: '请输入身份证号', trigger: 'blur' },
    { pattern: /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/, message: '请输入正确的身份证号', trigger: 'blur' }
  ]
}

// 获取骑手列表
const getRiderList = async () => {
  loading.value = true
  try {
    // TODO: 调用获取骑手列表API
    // const res = await getRiderListAPI({
    //   page: currentPage.value,
    //   pageSize: pageSize.value,
    //   query: searchQuery.value
    // })
    // riderList.value = res.data.list
    // total.value = res.data.total
  } catch (error) {
    console.error('获取骑手列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 获取统计数据
const getStatistics = async () => {
  try {
    // TODO: 调用获取统计数据API
    // const res = await getRiderStatisticsAPI()
    // statistics.value = res.data
  } catch (error) {
    console.error('获取统计数据失败:', error)
  }
}

// 新增骑手
const handleAdd = () => {
  dialogType.value = 'add'
  dialogVisible.value = true
  riderForm.value = {
    name: '',
    phone: '',
    idCard: ''
  }
}

// 提交表单
const submitRiderForm = async () => {
  if (!riderFormRef.value) return
  await riderFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        // TODO: 调用新增/编辑骑手API
        // const res = await (dialogType.value === 'add' ? addRiderAPI : updateRiderAPI)(riderForm.value)
        ElMessage.success(dialogType.value === 'add' ? '新增成功' : '编辑成功')
        dialogVisible.value = false
        getRiderList()
      } catch (error) {
        console.error(dialogType.value === 'add' ? '新增失败:' : '编辑失败:', error)
      }
    }
  })
}

// 删除骑手
const handleDelete = (row: any) => {
  ElMessageBox.confirm(
    '确定要删除该骑手吗？',
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(async () => {
    try {
      // TODO: 调用删除骑手API
      // await deleteRiderAPI(row.id)
      ElMessage.success('删除成功')
      getRiderList()
    } catch (error) {
      console.error('删除失败:', error)
    }
  })
}

// 分配订单
const handleAssignOrder = async (row: any) => {
  currentRider.value = row
  orderDialogVisible.value = true
  orderLoading.value = true
  try {
    // TODO: 调用获取待分配订单列表API
    // const res = await getPendingOrdersAPI()
    // pendingOrders.value = res.data
  } catch (error) {
    console.error('获取待分配订单失败:', error)
  } finally {
    orderLoading.value = false
  }
}

// 确认分配订单
const assignOrder = async (order: any) => {
  try {
    // TODO: 调用分配订单API
    // await assignOrderAPI({
    //   orderId: order.id,
    //   riderId: currentRider.value.id
    // })
    ElMessage.success('分配成功')
    orderDialogVisible.value = false
    getRiderList()
  } catch (error) {
    console.error('分配订单失败:', error)
  }
}

// 状态转换
const getStatusType = (status: number) => {
  const map: Record<number, string> = {
    0: 'info',    // 休息中
    1: 'success', // 在线
    2: 'warning'  // 配送中
  }
  return map[status] || 'info'
}

const getStatusText = (status: number) => {
  const map: Record<number, string> = {
    0: '休息中',
    1: '在线',
    2: '配送中'
  }
  return map[status] || '未知'
}

// 分页相关
const handleSizeChange = (val: number) => {
  pageSize.value = val
  getRiderList()
}

const handleCurrentChange = (val: number) => {
  currentPage.value = val
  getRiderList()
}

// 搜索
const handleSearch = () => {
  currentPage.value = 1
  getRiderList()
}

onMounted(() => {
  getRiderList()
  getStatistics()
})
</script>

<style lang="less" scoped>
.dashboard-container {
  padding: 20px;

  .container {
    background: #fff;
    padding: 20px;
    border-radius: 4px;
    margin-bottom: 20px;
  }

  .overview {
    .data-overview {
      display: flex;
      margin: 0;
      padding: 0;

      li {
        flex: 1;
        list-style: none;
        background: #f5f7fa;
        margin: 0 10px;
        padding: 20px;
        border-radius: 4px;
        text-align: center;

        &:first-child {
          margin-left: 0;
        }

        &:last-child {
          margin-right: 0;
        }

        .title {
          font-size: 14px;
          color: #606266;
          margin-bottom: 10px;
        }

        .number {
          font-size: 24px;
          font-weight: bold;
          color: #303133;
        }
      }
    }
  }

  .table-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }

  .pagination {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
  }
}
</style>
