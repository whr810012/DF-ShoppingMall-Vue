<script setup lang="ts">
import { reactive, ref, computed } from 'vue'
import { getSeckillListApi, deleteSeckillApi, updateSeckillApi, addSeckillApi, type SeckillFormData } from '@/api/miaosha'
import { ElMessage, ElMessageBox, ElTable } from 'element-plus'
import { Delete, Edit, Plus, Search, Refresh, Picture, CircleClose, VideoPlay } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'

// ------ .d.ts 属性类型接口 ------
interface Seckill {
  id: number
  name: string
  avatar: string
  price: number
  status: number
  createTime: string | null
  endTime: string | null
  number: number
}

// ------ 数据 ------

// 所有秒杀商品列表
const allSeckillList = ref<Seckill[]>([])
// 分页参数
const pageData = reactive({
  name: '',
  status: '',
  page: 1,
  pageSize: 6,
})

// 计算过滤后的列表
const filteredList = computed(() => {
  let list = [...allSeckillList.value]

  // 按名称筛选
  if (pageData.name) {
    list = list.filter(item => 
      item.name.toLowerCase().includes(pageData.name.toLowerCase())
    )
  }

  // 按状态筛选
  if (pageData.status !== '') {
    list = list.filter(item => 
      item.status === Number(pageData.status)
    )
  }

  return list
})

// 计算总数
const total = computed(() => filteredList.value.length)

// 计算当前页数据
const seckillList = computed(() => {
  const start = (pageData.page - 1) * pageData.pageSize
  const end = start + pageData.pageSize
  return filteredList.value.slice(start, end)
})

const options = [
  {
    value: 1,
    label: '进行中',
  },
  {
    value: 0,
    label: '已结束',
  }
]

// ------ 方法 ------

// 刷新页面数据
const showPageList = async () => {
  const { data: res } = await getSeckillListApi()
  console.log('秒杀商品列表')
  console.log(res.data)
  allSeckillList.value = res.data
}

showPageList() // 页面一开始就要展示秒杀商品列表

// 监听翻页和每页显示数量的变化
const handleCurrentChange = (val: number) => {
  pageData.page = val
}

const handleSizeChange = (val: number) => {
  pageData.pageSize = val
  pageData.page = 1 // 切换每页数量时重置为第一页
}

// 重置筛选条件
const resetFilter = () => {
  pageData.name = ''
  pageData.status = ''
  pageData.page = 1
}

const multiTableRef = ref<InstanceType<typeof ElTable>>()
const multiSelection = ref<Seckill[]>([])

const handleSelectionChange = (val: Seckill[]) => {
  multiSelection.value = val
}

// 新增和修改秒杀商品都是同一个页面，不过要根据路径传参的方式来区分
const router = useRouter()
const to_add_update = (row?: any) => {
  if (row && row.id) {
    router.push({
      path: '/seckill/add',
      query: { id: row.id }
    })
  } else {
    dialogVisible.value = true
  }
}

// 修改秒杀商品状态
const change_btn = async (row: any) => {
  await updateSeckillApi({
    id: row.id,
    status: row.status === 1 ? 0 : 1
  })
  // 修改后刷新页面，更新数据
  showPageList()
  ElMessage({
    type: 'success',
    message: '修改成功',
  })
}

// 删除秒杀商品
const deleteBatch = (row?: any) => {
  ElMessageBox.confirm(
    '该操作会永久删除秒杀商品，是否继续？',
    'Warning',
    {
      confirmButtonText: 'OK',
      cancelButtonText: 'Cancel',
      type: 'warning',
    }
  )
    .then(async () => {
      // 1. 没传入行数据，批量删除
      if (row == undefined) {
        if (multiSelection.value.length == 0) {
          ElMessage({
            type: 'warning',
            message: '请先选择要删除的秒杀商品',
          })
          return
        }
        // 拿到当前 multiSelection.value 的所有id，然后调用批量删除接口
        let ids: number[] = multiSelection.value.map(item => item.id)
        let res = await deleteSeckillApi(ids)
        showPageList()
        if (res.data.code != 0) return
      }
      // 2. 传入行数据，单个删除
      else {
        let res = await deleteSeckillApi([row.id])
        showPageList()
      }
      // 删除后刷新页面，更新数据
      ElMessage({
        type: 'success',
        message: '删除成功',
      })
    })
    .catch(() => {
      ElMessage({
        type: 'info',
        message: '取消删除',
      })
    })
}

// 表单数据
const dialogVisible = ref(false)
const formData = reactive<SeckillFormData>({
  name: '',
  price: 0,
  number: 0,
  createTime: '',
  endTime: '',
  avatar: '',
  image: null,
  status: 1 // 默认为进行中状态，但不会传递给后端
})

// 表单规则
const rules = {
  name: [{ required: true, message: '请输入商品名称', trigger: 'blur' }],
  price: [
    { required: true, message: '请输入商品价格', trigger: 'blur' },
    { type: 'number', min: 0, message: '价格必须大于0', trigger: 'blur' }
  ],
  number: [
    { required: true, message: '请输入商品数量', trigger: 'blur' },
    { type: 'number', min: 1, message: '数量必须大于0', trigger: 'blur' }
  ],
  createTime: [{ required: true, message: '请选择开始时间', trigger: 'change' }],
  endTime: [{ required: true, message: '请选择结束时间', trigger: 'change' }],
  image: [{ required: true, message: '请上传商品图片', trigger: 'change' }],
}

const formRef = ref()

// 图片上传的处理
const handleAvatarChange = (uploadFile: any) => {
  console.log('图片上传的处理')
  console.log(uploadFile)
  
  const file = uploadFile.raw
  const isImage = file.type.startsWith('image/')
  const isLt2M = file.size / 1024 / 1024 < 2

  if (!isImage) {
    ElMessage.error('只能上传图片文件！')
    return
  }
  if (!isLt2M) {
    ElMessage.error('图片大小不能超过 2MB！')
    return
  }

  formData.image = file
  // 使用 URL.createObjectURL 创建预览
  formData.avatar = URL.createObjectURL(file)
  
  // 手动触发表单验证
  if (formRef.value) {
    formRef.value.validateField('image')
  }
}

// 格式化时间
const formatDateTime = (date: string | Date) => {
  if (!date) return ''
  const d = new Date(date)
  return d.toISOString().slice(0, 19)  // 返回格式：2025-01-14T16:00:00
}

// 提交表单
const submitForm = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid: boolean) => {
    if (valid) {
      if (!formData.image) {
        ElMessage.warning('请上传商品图片')
        return
      }

      try {
        const res = await addSeckillApi({
          name: formData.name,
          price: formData.price,
          number: formData.number,
          createTime: formatDateTime(formData.createTime),
          endTime: formatDateTime(formData.endTime),
          image: formData.image
        })
        
        if (res.code === 1) {
          ElMessage.success('添加成功')
          dialogVisible.value = false
          showPageList() // 刷新列表
          resetForm()
        } else {
          ElMessage.error(res.msg || '添加失败')
        }
      } catch (error: any) {
        console.error('添加失败:', error)
        ElMessage.error(error.response?.data?.msg || '添加失败')
      }
    }
  })
}

// 重置表单
const resetForm = () => {
  if (formRef.value) {
    formRef.value.resetFields()
  }
  // 如果有预览URL，需要释放
  if (formData.avatar && formData.avatar.startsWith('blob:')) {
    URL.revokeObjectURL(formData.avatar)
  }
  formData.avatar = ''
  formData.image = null
}
</script>

<template>
  <el-card class="seckill-card">
    <div class="filter-section">
      <div class="filter-inputs">
        <el-input size="large" class="input" v-model="pageData.name" placeholder="请输入商品名" clearable>
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-select class="input" clearable v-model="pageData.status" placeholder="选择商品状态" size="large">
          <el-option v-for="item in options" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </div>
      <div class="filter-buttons">
        <el-button size="large" class="btn" type="primary" @click="showPageList()">
          <el-icon><Search /></el-icon>查询
        </el-button>
        <el-button size="large" class="btn" @click="resetFilter()">
          <el-icon><Refresh /></el-icon>重置
        </el-button>
        <el-button size="large" class="btn" type="danger" @click="deleteBatch()">
          <el-icon><Delete /></el-icon>批量删除
        </el-button>
        <el-button size="large" class="btn" type="success" @click="to_add_update()">
          <el-icon><Plus /></el-icon>添加商品
        </el-button>
      </div>
    </div>

    <el-table ref="multiTableRef" :data="seckillList" stripe @selection-change="handleSelectionChange" class="seckill-table">
      <el-table-column type="selection" width="55" />
      <el-table-column prop="name" label="商品名" align="center" min-width="120" />
      <el-table-column prop="avatar" label="图片" align="center" width="100">
        <template #default="scope">
          <el-image 
            :src="scope.row.avatar" 
            :preview-src-list="[scope.row.avatar]"
            preview-teleported
            fit="cover"
            class="product-image"
            :initial-index="0"
          >
            <template #error>
              <div class="image-error">
                <el-icon><Picture /></el-icon>
              </div>
            </template>
          </el-image>
        </template>
      </el-table-column>
      <el-table-column prop="price" label="价格" align="center" width="100">
        <template #default="scope">
          <span class="price">¥{{ scope.row.price.toFixed(2) }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="number" label="库存" align="center" width="80" />
      <el-table-column prop="status" label="状态" align="center" width="100">
        <template #default="scope">
          <el-tag :type="scope.row.status === 1 ? 'success' : 'danger'" effect="dark" round>
            {{ scope.row.status === 1 ? '进行中' : '已结束' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createTime" label="开始时间" width="180" align="center" />
      <el-table-column prop="endTime" label="结束时间" width="180" align="center" />
      <el-table-column label="操作" width="200" align="center" fixed="right">
        <template #default="scope">
          <el-button-group>
            <el-button @click="to_add_update(scope.row)" type="primary" :icon="Edit">修改</el-button>
            <el-button 
              @click="change_btn(scope.row)" 
              :type="scope.row.status === 1 ? 'danger' : 'success'"
              :icon="scope.row.status === 1 ? 'CircleClose' : 'VideoPlay'"
            >
              {{ scope.row.status === 1 ? '结束' : '开始' }}
            </el-button>
            <el-button @click="deleteBatch(scope.row)" type="danger" :icon="Delete">删除</el-button>
          </el-button-group>
        </template>
      </el-table-column>
      <template #empty>
        <el-empty description="暂无数据" />
      </template>
    </el-table>

    <el-pagination 
      class="pagination" 
      background 
      layout="total, sizes, prev, pager, next, jumper" 
      :total="total"
      :page-sizes="[6, 10, 20, 50]" 
      v-model:current-page="pageData.page" 
      v-model:page-size="pageData.pageSize"
      @current-change="handleCurrentChange" 
      @size-change="handleSizeChange" 
    />
  </el-card>

  <!-- 新增秒杀商品弹窗 -->
  <el-dialog
    v-model="dialogVisible"
    title="新增秒杀商品"
    width="500px"
    @close="resetForm"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-width="100px"
      class="seckill-form"
    >
      <el-form-item label="商品名称" prop="name">
        <el-input v-model="formData.name" placeholder="请输入商品名称" />
      </el-form-item>

      <el-form-item label="商品价格" prop="price">
        <el-input-number 
          v-model="formData.price" 
          :precision="2" 
          :step="0.1" 
          :min="0"
          style="width: 100%"
        />
      </el-form-item>

      <el-form-item label="商品数量" prop="number">
        <el-input-number 
          v-model="formData.number" 
          :min="1" 
          :step="1"
          style="width: 100%"
        />
      </el-form-item>

      <el-form-item label="开始时间" prop="createTime">
        <el-date-picker
          v-model="formData.createTime"
          type="datetime"
          placeholder="选择开始时间"
          style="width: 100%"
        />
      </el-form-item>

      <el-form-item label="结束时间" prop="endTime">
        <el-date-picker
          v-model="formData.endTime"
          type="datetime"
          placeholder="选择结束时间"
          style="width: 100%"
        />
      </el-form-item>

      <el-form-item label="商品图片" prop="image">
        <el-upload
          class="avatar-uploader"
          :auto-upload="false"
          :show-file-list="false"
          :on-change="handleAvatarChange"
          accept="image/jpeg,image/png"
        >
          <img 
            v-if="formData.avatar" 
            :src="formData.avatar" 
            class="avatar"
          />
          <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
        </el-upload>
      </el-form-item>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">确定</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<style lang="less" scoped>
.seckill-card {
  margin: 20px;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);

  .filter-section {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    flex-wrap: wrap;
    gap: 16px;
    padding: 16px;
    background: #f8f9fa;
    border-radius: 8px;
    border: 1px solid #e9ecef;

    .filter-inputs {
      display: flex;
      align-items: center;
      gap: 12px;
      flex: 1;
      min-width: 0;

      .input {
        width: 200px;
        :deep(.el-input__wrapper) {
          box-shadow: 0 0 0 1px #dcdfe6 inset;
          &:hover {
            box-shadow: 0 0 0 1px #409eff inset;
          }
          &.is-focus {
            box-shadow: 0 0 0 1px #409eff inset;
          }
        }
        @media screen and (max-width: 1200px) {
          width: 180px;
        }
      }
    }

    .filter-buttons {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-shrink: 0;
    }
  }

  :deep(.el-button) {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    padding: 8px 16px;
    border-radius: 6px;
    transition: all 0.3s;
    
    .el-icon {
      margin-right: 4px;
    }

    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    &.el-button--primary {
      background: linear-gradient(45deg, #409eff, #50a3ff);
    }

    &.el-button--success {
      background: linear-gradient(45deg, #67c23a, #85ce61);
    }

    &.el-button--danger {
      background: linear-gradient(45deg, #f56c6c, #ff7875);
    }
  }

  .seckill-table {
    margin-bottom: 20px;
    border-radius: 8px;
    overflow: hidden;

    :deep(.el-table__header) {
      background-color: #f5f7fa;
    }

    .product-image {
      width: 60px;
      height: 60px;
      border-radius: 6px;
      cursor: pointer;
      transition: transform 0.3s;

      &:hover {
        transform: scale(1.05);
      }
    }

    .image-error {
      width: 60px;
      height: 60px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f5f7fa;
      border-radius: 6px;
      color: #909399;
    }

    .price {
      color: #f56c6c;
      font-weight: bold;
    }

    :deep(.el-button-group) {
      display: flex;
      gap: 5px;

      .el-button {
        margin: 0;
      }
    }
  }

  .pagination {
    display: flex;
    justify-content: center;
    margin-top: 20px;
  }
}

// 响应式布局
@media screen and (max-width: 768px) {
  .seckill-card {
    margin: 10px;

    .filter-section {
      flex-direction: column;
      align-items: stretch;

      .filter-inputs, .filter-buttons {
        justify-content: center;
      }
    }

    .seckill-table {
      :deep(.el-table__body-wrapper) {
        overflow-x: auto;
      }
    }
  }
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
  width: 178px;
  height: 178px;
  text-align: center;
  line-height: 178px;
}

.avatar-wrapper {
  width: 178px;
  height: 178px;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
}

.avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.seckill-form {
  max-height: 60vh;
  overflow-y: auto;
  padding-right: 20px;
}
</style>