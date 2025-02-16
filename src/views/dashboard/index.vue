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
        <el-table-column type="index" label="序号" align="center" width="70"/>
        <el-table-column prop="name" label="姓名" align="center" />
        <el-table-column prop="account" label="账号" align="center" />
        <el-table-column prop="phone" label="手机号" align="center" />
        <el-table-column prop="status" label="状态">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="sex" label="性别" align="center" />
        <el-table-column label="头像" align="center">
          <template #default="{ row }">
            <el-image 
              style="width: 50px; height: 50px; border-radius: 50%"
              :src="row.avatar"
              fit="cover"
            >
              <template #error>
                <div class="image-slot">
                  <el-icon><Picture /></el-icon>
                </div>
              </template>
            </el-image>
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center">
          <template #default="scope">
            <el-button 
              type="primary" 
              size="small" 
              @click="handleAssignOrder(scope.row)"
              :disabled="scope.row.status === 1"
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
      title="新增骑手"
      width="500px"
    >
      <el-form :model="riderForm" :rules="rules" ref="riderFormRef" label-width="100px">
        <el-form-item label="账号" prop="account">
          <el-input v-model="riderForm.account" placeholder="请输入账号"/>
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="riderForm.password" type="password" show-password placeholder="请输入密码"/>
        </el-form-item>
        <el-form-item label="姓名" prop="name">
          <el-input v-model="riderForm.name" placeholder="请输入姓名"/>
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="riderForm.phone" placeholder="请输入手机号"/>
        </el-form-item>
        <el-form-item label="性别" prop="sex">
          <el-select v-model="riderForm.sex" placeholder="请选择性别">
            <el-option label="男" value="男" />
            <el-option label="女" value="女" />
          </el-select>
        </el-form-item>
        <el-form-item label="头像" prop="image">
          <el-upload
            class="avatar-uploader"
            :auto-upload="false"
            :show-file-list="false"
            :on-change="handleAvatarSuccess"
            :before-upload="beforeAvatarUpload"
            accept="image/jpeg,image/png"
          >
            <img v-if="riderForm.image" :src="riderForm.image" class="avatar" />
            <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
          </el-upload>
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
      width="900px"
      class="assign-order-dialog"
    >
      <el-table 
        :data="pendingOrders" 
        style="width: 100%" 
        v-loading="orderLoading"
        :header-cell-style="{
          background: '#F5F7FA',
          color: '#303133',
          fontWeight: 600,
          fontSize: '14px'
        }"
      >
        <el-table-column prop="id" label="订单号" width="100">
          <template #default="{ row }">
            <span class="order-id">{{ row.id }}</span>
          </template>
        </el-table-column>
        <el-table-column label="收货信息" min-width="200">
          <template #default="{ row }">
            <div class="address-info">
              <div class="user-info">
                <span class="name">{{ row.address.name }}</span>
              </div>
              <div class="address">{{ row.address.address }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="商品信息" min-width="300">
          <template #default="{ row }">
            <div class="order-items-wrapper">
              <div v-for="(item, index) in row.orderDityList" :key="index" class="order-item">
                <div class="item-info">
                  <el-image 
                    v-if="item.image" 
                    :src="item.image" 
                    class="item-image"
                    :preview-src-list="[item.image]"
                  >
                    <template #error>
                      <div class="image-placeholder">
                        <el-icon><Picture /></el-icon>
                      </div>
                    </template>
                  </el-image>
                  <div class="item-detail">
                    <div class="name text-ellipsis">{{ item.name }}</div>
                    <div class="price">¥{{ item.price.toFixed(2) }}</div>
                  </div>
                </div>
                <span class="order-item-count">x{{ item.number }}</span>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="price" label="订单金额" width="120" align="center">
          <template #default="{ row }">
            <span class="total-price">¥{{ row.price.toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="下单时间" width="150" align="center" />
        <el-table-column label="操作" width="80" fixed="right" align="center">
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
import { addQiShouApi, deleteQiShouApi, queryQiShouApi, queryAllQiShouApi, assignOrderToRiderApi } from '@/api/qishou'
import { getOrderListApi } from '@/api/order'

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
  account: '',
  password: '',
  name: '',
  phone: '',
  sex: '男',
  image: '',
  imageFile: null as File | null,
  status:0
})

// 订单分配
const orderDialogVisible = ref(false)
const orderLoading = ref(false)
const pendingOrders = ref([])
const currentRider = ref<any>(null)

// 表单校验规则
const rules = {
  account: [
    { required: true, message: '请输入账号', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9]{1,10}$/, message: '账号必须是1-10位字母或数字', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度在 6 到 20 个字符', trigger: 'blur' }
  ],
  name: [
    { required: true, message: '请输入姓名', trigger: 'blur' }
  ],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ],
  sex: [
    { required: true, message: '请选择性别', trigger: 'change' }
  ],
  image: [
    { required: true, message: '请上传头像', trigger: 'change' }
  ]
}

// 获取骑手列表
const getRiderList = async () => {
  loading.value = true
  try {
    const { data: res } = await queryAllQiShouApi()
    if (res.code === 1) {
      // 处理分页和搜索
      let filteredList = res.data
      if (searchQuery.value) {
        filteredList = res.data.filter((item: any) => 
          item.name.includes(searchQuery.value) || 
          item.phone.includes(searchQuery.value)
        )
      }
      total.value = filteredList.length
      // 分页处理
      const start = (currentPage.value - 1) * pageSize.value
      const end = start + pageSize.value
      riderList.value = filteredList.slice(start, end)
      
      // 更新统计数据
      statistics.value = {
        total: res.data.length,
        online: res.data.filter((item: any) => item.status === 1).length,
        delivering: res.data.filter((item: any) => item.status === 1).length,
        resting: res.data.filter((item: any) => item.status === 0).length
      }
    }
  } catch (error) {
    console.error('获取骑手列表失败:', error)
    ElMessage.error('获取骑手列表失败')
  } finally {
    loading.value = false
  }
}

// 新增骑手
const handleAdd = () => {
  dialogVisible.value = true
  riderForm.value = {
    account: '',
    password: '',
    name: '',
    phone: '',
    sex: '男',
    image: '',
    imageFile: null,
    status: 0
  }
}

// 提交表单
const submitRiderForm = async () => {
  if (!riderFormRef.value) return
  await riderFormRef.value.validate(async (valid) => {
    if (valid) {
      if (!riderForm.value.imageFile) {
        ElMessage.warning('请上传头像')
        return
      }

      try {
        const formData = new FormData()
        formData.append('status', String(riderForm.value.status))
        formData.append('account', riderForm.value.account)
        formData.append('password', riderForm.value.password)
        formData.append('name', riderForm.value.name)
        formData.append('phone', riderForm.value.phone)
        formData.append('sex', riderForm.value.sex)
        formData.append('image', riderForm.value.imageFile)

        const { data: res } = await addQiShouApi(formData)
        
        if (res.code === 1) {
          ElMessage.success('新增成功')
          dialogVisible.value = false
          getRiderList()
        } else {
          ElMessage.error(res.msg || '新增失败')
        }
      } catch (error: any) {
        console.error('新增失败:', error)
        ElMessage.error(error.response?.data?.msg || '新增失败')
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
      const { data: res } = await deleteQiShouApi([row.id])
      if (res.code === 1) {
        ElMessage.success('删除成功')
        getRiderList()
      } else {
        ElMessage.error(res.msg || '删除失败')
      }
    } catch (error: any) {
      console.error('删除失败:', error)
      ElMessage.error(error.response?.data?.msg || '删除失败')
    }
  })
}

// 分配订单
const handleAssignOrder = async (row: any) => {
  currentRider.value = row
  orderDialogVisible.value = true
  orderLoading.value = true
  try {
    const { data: res } = await getOrderListApi()
    if (res.code === 1) {
      // 筛选出status为1的订单
      pendingOrders.value = res.data.filter((order: any) => order.status === 1)
      if (pendingOrders.value.length === 0) {
        ElMessage.info('当前没有待分配的订单')
      }
    } else {
      ElMessage.error(res.msg || '获取待分配订单失败')
    }
  } catch (error) {
    console.error('获取待分配订单失败:', error)
    ElMessage.error('获取待分配订单失败')
  } finally {
    orderLoading.value = false
  }
}

// 确认分配订单
const assignOrder = async (order: any) => {
  try {
    const res = await assignOrderToRiderApi({
      orderId: order.id,
      riderId: currentRider.value.id
    })
    console.log(res)
    
    if (res.status === 200) {
      ElMessage.success('分配成功')
      orderDialogVisible.value = false
      getRiderList()
    } else {
      ElMessage.error('分配失败')
    }
  } catch (error: any) {
    console.error('分配订单失败:', error)
    ElMessage.error(error.response?.data?.msg || '分配订单失败')
  }
}

// 状态转换
const getStatusType = (status: number) => {
  const map: Record<number, string> = {
    0: 'info',    // 休息中
    1: 'success', // 在线
  }
  return map[status] || 'info'
}

const getStatusText = (status: number) => {
  const map: Record<number, string> = {
    0: '休息中',
    1: '配送中'
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

// 修改头像上传处理函数
const handleAvatarSuccess = (uploadFile: any) => {
  if (uploadFile.raw) {
    riderForm.value.image = URL.createObjectURL(uploadFile.raw)
    riderForm.value.imageFile = uploadFile.raw
  }
}

const beforeAvatarUpload = (file: File) => {
  const isJPG = file.type === 'image/jpeg' || file.type === 'image/png'
  const isLt2M = file.size / 1024 / 1024 < 2

  if (!isJPG) {
    ElMessage.error('上传头像图片只能是 JPG/PNG 格式!')
  }
  if (!isLt2M) {
    ElMessage.error('上传头像图片大小不能超过 2MB!')
  }
  return isJPG && isLt2M
}

onMounted(() => {
  getRiderList()
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

  .avatar-uploader {
    :deep(.el-upload) {
      border: 1px dashed #d9d9d9;
      border-radius: 6px;
      cursor: pointer;
      position: relative;
      overflow: hidden;
      transition: var(--el-transition-duration-fast);

      &:hover {
        border-color: var(--el-color-primary);
      }
    }
  }

  .avatar-uploader-icon {
    font-size: 28px;
    color: #8c939d;
    width: 100px;
    height: 100px;
    text-align: center;
    line-height: 100px;
  }

  .avatar {
    width: 100px;
    height: 100px;
    display: block;
    object-fit: cover;
  }

  .assign-order-dialog {
    :deep(.el-dialog__body) {
      padding: 20px;
    }
  }

  .order-id {
    font-family: Consolas, Monaco, monospace;
    color: #409EFF;
    font-weight: 500;
  }

  .address-info {
    padding: 4px 0;

    .user-info {
      display: flex;
      align-items: center;
      margin-bottom: 6px;

      .name {
        font-size: 14px;
        font-weight: 600;
        color: #303133;
      }
    }

    .address {
      color: #606266;
      font-size: 13px;
      line-height: 1.4;
      word-break: break-all;
    }
  }

  .order-items-wrapper {
    padding: 4px 0;
  }

  .order-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
    padding-bottom: 12px;
    border-bottom: 1px dashed #EBEEF5;
    
    &:last-child {
      margin-bottom: 0;
      padding-bottom: 0;
      border-bottom: none;
    }

    .item-info {
      display: flex;
      align-items: center;
      flex: 1;
      margin-right: 12px;
      
      .item-image {
        width: 40px;
        height: 40px;
        border-radius: 4px;
        margin-right: 8px;
        border: 1px solid #EBEEF5;
        overflow: hidden;
      }

      .image-placeholder {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #F5F7FA;
        color: #909399;
      }

      .item-detail {
        flex: 1;
        min-width: 0;

        .name {
          font-size: 14px;
          color: #303133;
          margin-bottom: 4px;
        }

        .price {
          font-size: 13px;
          color: #F56C6C;
          font-weight: 500;
        }
      }
    }

    .order-item-count {
      color: #909399;
      font-size: 13px;
      background: #F5F7FA;
      padding: 2px 8px;
      border-radius: 12px;
    }
  }

  .total-price {
    color: #F56C6C;
    font-weight: 600;
    font-size: 15px;
  }

  .text-ellipsis {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}
</style>
