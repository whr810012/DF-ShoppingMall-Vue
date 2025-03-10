<script setup lang="ts">

import { reactive, ref } from 'vue'
import { addSortApi, amendSortApi, deleteSortApi, getSortListApi } from '@/api/sort'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRouter } from 'vue-router'
import { Search, Plus } from '@element-plus/icons-vue'

// ------ .d.ts 属性类型接口 ------
interface category {
  id: number
  name: string
  createTime: string
  image: File | null
  imageUrl: string
  avatar: string
}

// ------ 数据 ------

// 当前页的分类列表
const categoryList = ref<category[]>([])
// 带查询条件的分页参数
const pageData = reactive({
  name: '',
  type: '',
  page: 1,
  pageSize: 6,
  total: 0
})
const options = [
  {
    value: '1',
    label: '菜品分类',
  },
  {
    value: '2',
    label: '套餐分类',
  }
]

// 添加一个用于存储完整数据的ref
const allCategoryList = ref<category[]>([])

// 文件上传ref
const fileInput = ref<HTMLInputElement | null>(null)
const editFileInput = ref<HTMLInputElement | null>(null)

// ------ 方法 ------

// 页面初始化，就根据token去获取用户信息，才能实现如果没有token/token过期，刚开始就能够跳转到登录页
const init = async () => {
  const { data: res } = await getSortListApi()
  console.log('分类列表', res)
  // 保存完整数据，并设置imageUrl
  allCategoryList.value = res.data.map((item: any) => ({
    ...item,
    imageUrl: item.avatar || ''  // 使用avatar作为图片URL
  }))
  // 设置总数
  pageData.total = res.data.length
  // 处理分页数据
  handlePageData()
}

init()  // 页面初始化/分页查询，写在这里时的生命周期是beforecreated/created的时候

// 监听翻页和每页显示数量的变化
const handleCurrentChange = (val: number) => {
  pageData.page = val
  handlePageData()
}

const handleSizeChange = (val: number) => {
  pageData.pageSize = val
  // 切换每页数量时重置为第一页
  pageData.page = 1
  handlePageData()
}

// 修改分类(路径传参，到update页面后，根据id查询分类信息，回显到表单中)
const router = useRouter()
const update_btn = (row: category) => {
  editingCategory.value = { 
    ...row,
    imageUrl: row.avatar || ''  // 使用avatar作为图片URL
  }
  dialogVisible.value = true
}

// 修改分类状态
const change_btn = async (row: any) => {
  console.log('要修改的行数据')
  console.log(row)
  await amendSortApi(row.id)
  // 修改后刷新页面，更新数据
  init()
  ElMessage({
    type: 'success',
    message: '修改成功',
  })
}

// 删除分类
const delete_btn = (row: any) => {
  // 检查是否是前四个分类
  const index = categoryList.value.findIndex(item => item.id === row.id)
  if (index < 4) {
    ElMessage({
      type: 'warning',
      message: '前四个分类不允许删除',
    })
    return
  }

  console.log('要删除的行数据')
  console.log(row)
  ElMessageBox.confirm(
    '该操作会永久删除分类，是否继续？',
    'Warning',
    {
      confirmButtonText: 'OK',
      cancelButtonText: 'Cancel',
      type: 'warning',
    }
  )
    .then(async () => {
      console.log('要删除的行数据')
      console.log(row)
      await deleteSortApi([row.id])
      // 删除后刷新页面，更新数据
      init()
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

// 添加处理分页数据的函数
const handlePageData = () => {
  const start = (pageData.page - 1) * pageData.pageSize
  const end = start + pageData.pageSize
  // 过滤搜索条件
  const filteredData = allCategoryList.value.filter(item => 
    item.name.toLowerCase().includes(pageData.name.toLowerCase())
  )
  // 更新总数
  pageData.total = filteredData.length
  // 截取当前页数据
  categoryList.value = filteredData.slice(start, end)
}

// 添加搜索处理函数
const handleSearch = () => {
  pageData.page = 1  // 搜索时重置为第一页
  handlePageData()
}

// 控制弹窗显示
const dialogVisible = ref(false)
// 当前编辑的分类数据
const editingCategory = ref<category>({
  id: 0,
  name: '',
  createTime: '',
  image: null as File | null,
  imageUrl: '',
  avatar: ''
})

// 处理图片上传
const handleImageChange = (e: Event, type: 'add' | 'edit') => {
  const target = e.target as HTMLInputElement
  if (target.files && target.files[0]) {
    const file = target.files[0]
    const reader = new FileReader()
    reader.onload = (e) => {
      if (type === 'add') {
        addForm.image = file
        addForm.imageUrl = e.target?.result as string
      } else {
        editingCategory.value.image = file
        editingCategory.value.imageUrl = e.target?.result as string
      }
    }
    reader.readAsDataURL(file)
  }
}

// 处理文件上传点击
const handleUploadClick = (type: 'add' | 'edit') => {
  if (type === 'add' && fileInput.value) {
    fileInput.value.click()
  } else if (type === 'edit' && editFileInput.value) {
    editFileInput.value.click()
  }
}

// 修改保存修改的函数
const handleSave = async () => {
  try {
    const formData = new FormData()
    formData.append('id', editingCategory.value.id.toString())
    formData.append('name', editingCategory.value.name)
    if (editingCategory.value.image) {
      formData.append('image', editingCategory.value.image)
    }

    await amendSortApi(formData).then(res => {
      if (res.data.code !== 0) {
        ElMessage({
          type: 'success',
          message: '修改成功'
        })
        dialogVisible.value = false
        init() // 刷新数据
      }
    })
  } catch (error) {
    ElMessage({
      type: 'error',
      message: '修改失败'
    })
  }
}

// 控制新增弹窗显示
const addDialogVisible = ref(false)
// 新增分类的表单数据
const addForm = reactive({
  name: '',  // 分类名称
  image: null as File | null,  // 分类图片
  imageUrl: ''  // 图片预览URL
})

// 修改新增分类的处理函数
const handleAdd = async () => {
  try {
    if (!addForm.name.trim()) {
      ElMessage({
        type: 'warning',
        message: '请输入分类名称'
      })
      return
    }
    
    const formData = new FormData()
    formData.append('name', addForm.name.trim())
    if (addForm.image) {
      formData.append('image', addForm.image)
    }
    
    const { data: res } = await addSortApi(formData)

    if (res.code === 0) {
      return
    }
    
    ElMessage({
      type: 'success',
      message: '添加成功'
    })
    addDialogVisible.value = false
    // 重置表单
    addForm.name = ''
    addForm.image = null
    addForm.imageUrl = ''
    init() // 刷新数据
  } catch (error: any) {
    ElMessage({
      type: 'error',
      message: error.response?.data?.msg || '添加失败'
    })
  }
}
</script>

<template>
  <el-card class="category-card">
    <!-- 修改搜索区域的样式 -->
    <div class="search-area">
      <div class="left">
        <el-input
          size="default"
          class="search-input"
          v-model="pageData.name"
          placeholder="请输入分类名称"
          clearable
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
      </div>
      <div class="right">
        <el-button type="primary" @click="handleSearch">
          <el-icon><Search /></el-icon>
          查询
        </el-button>
        <el-button type="success" @click="addDialogVisible = true">
          <el-icon><Plus /></el-icon>
          新增分类
        </el-button>
      </div>
    </div>

    <!-- 其他表格部分保持不变 -->
    <el-table :data="categoryList" stripe>
      <el-table-column prop="id" label="序号" width="80" align="center" />
      <el-table-column prop="name" label="分类名称" align="center" />
      <el-table-column label="分类图片" align="center">
        <template #default="scope">
          <el-image 
            style="width: 50px; height: 50px; border-radius: 4px;"
            :src="scope.row.avatar"
            fit="cover"
            :preview-src-list="[scope.row.avatar]"
          >
            <template #error>
              <div class="image-slot">
                <el-icon><Plus /></el-icon>
              </div>
            </template>
          </el-image>
        </template>
      </el-table-column>
      <el-table-column prop="createTime" label="创建时间" width="200" align="center" />
      <el-table-column label="操作" width="200" align="center">
        <template #default="scope">
          <el-button @click="update_btn(scope.row)" type="primary" size="small">修改</el-button>
          <el-button 
            v-if="scope.$index >= 4" 
            @click="delete_btn(scope.row)" 
            type="danger" 
            size="small"
          >删除</el-button>
        </template>
      </el-table-column>
      <template #empty>
        <el-empty description=" 没有数据" />
      </template>
    </el-table>

    <!-- element ui 官方推荐使用 v-model 双向绑定 而不是使用事件监听 -->
    <!-- 但是为了监听后还要调用相关函数，看来只能用事件了... -->
    <!-- 有没有办法让v-model的值发生改变时自动触发更新函数？ -->
    <el-pagination 
      class="page" 
      background 
      :total="pageData.total"
      :page-sizes="[10, 20, 30, 40]" 
      v-model:current-page="pageData.page" 
      v-model:page-size="pageData.pageSize"
      @current-change="handleCurrentChange" 
      @size-change="handleSizeChange"
      layout="total, sizes, prev, pager, next, jumper"
    >
      <template #total>
        总 <b>{{ pageData.total }}</b> 条
      </template>
      <template #sizes>
        <span style="margin-right: 4px">每页</span>{{ pageData.pageSize }}条
      </template>
    </el-pagination>

    <el-dialog
      v-model="dialogVisible"
      title="修改分类"
      width="30%"
      :close-on-click-modal="false"
    >
      <el-form label-width="80px">
        <el-form-item label="分类名称">
          <el-input 
            v-model="editingCategory.name"
            placeholder="请输入分类名称"
          />
        </el-form-item>
        <el-form-item label="分类图片">
          <div class="image-upload">
            <input
              type="file"
              accept="image/*"
              @change="(e) => handleImageChange(e, 'edit')"
              ref="editFileInput"
              style="display: none"
            />
            <div 
              class="upload-box" 
              @click="() => handleUploadClick('edit')"
              v-if="!editingCategory.imageUrl"
            >
              <el-icon><Plus /></el-icon>
              <span>点击上传图片</span>
            </div>
            <div class="preview" v-else>
              <img :src="editingCategory.imageUrl" alt="预览图片">
              <div class="mask">
                <el-button 
                  type="primary" 
                  @click="() => handleUploadClick('edit')"
                >重新上传</el-button>
              </div>
            </div>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSave">
            确认
          </el-button>
        </span>
      </template>
    </el-dialog>

    <el-dialog
      v-model="addDialogVisible"
      title="新增分类"
      width="30%"
      :close-on-click-modal="false"
    >
      <el-form label-width="80px">
        <el-form-item label="分类名称">
          <el-input 
            v-model="addForm.name"
            placeholder="请输入分类名称"
          />
        </el-form-item>
        <el-form-item label="分类图片">
          <div class="image-upload">
            <input
              type="file"
              accept="image/*"
              @change="(e) => handleImageChange(e, 'add')"
              ref="fileInput"
              style="display: none"
            />
            <div 
              class="upload-box" 
              @click="() => handleUploadClick('add')"
              v-if="!addForm.imageUrl"
            >
              <el-icon><Plus /></el-icon>
              <span>点击上传图片</span>
            </div>
            <div class="preview" v-else>
              <img :src="addForm.imageUrl" alt="预览图片">
              <div class="mask">
                <el-button 
                  type="primary" 
                  @click="() => handleUploadClick('add')"
                >重新上传</el-button>
              </div>
            </div>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="addDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleAdd">
            确认
          </el-button>
        </span>
      </template>
    </el-dialog>
  </el-card>
</template>


<style lang="less" scoped>
.category-card {
  margin: 20px;
  
  .search-area {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px;
    
    .left {
      .search-input {
        width: 300px;
      }
    }
    
    .right {
      display: flex;
      gap: 12px;
      
      .el-button {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 8px 16px;
        
        .el-icon {
          margin-right: 4px;
        }
      }
    }
  }
}

// 修改表格样式
.el-table {
  width: 95%;
  margin: 16px auto;
  border-radius: 8px;
  overflow: hidden;
  
  :deep(th.el-table__cell) {
    background-color: #f5f7fa;
    color: #606266;
    font-weight: 600;
  }
}

// 修改按钮样式
.el-button {
  margin: 0 4px;
  padding: 6px 16px;
  font-size: 13px;
  border-radius: 4px;
  
  &.el-button--primary {
    background-color: #409eff;
    border-color: #409eff;
    
    &:hover {
      background-color: #66b1ff;
      border-color: #66b1ff;
    }
  }
  
  &.el-button--danger {
    background-color: #f56c6c;
    border-color: #f56c6c;
    
    &:hover {
      background-color: #f78989;
      border-color: #f78989;
    }
  }
}

// 分页样式优化
.el-pagination {
  margin-top: 25px;
  display: flex;
  justify-content: center;
}

// 移除不需要的样式
.horizontal,
.add_btn {
  display: none;
}

.dialog-footer {
  .el-button {
    min-width: 80px;
  }
}

:deep(.el-dialog) {
  border-radius: 8px;
  
  .el-dialog__header {
    margin-right: 0;
    padding: 20px;
    border-bottom: 1px solid #dcdfe6;
  }
  
  .el-dialog__body {
    padding: 30px 20px;
  }
  
  .el-dialog__footer {
    padding: 20px;
    border-top: 1px solid #dcdfe6;
  }
}

.image-upload {
  .upload-box {
    width: 200px;
    height: 200px;
    border: 1px dashed #d9d9d9;
    border-radius: 6px;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    color: #8c939d;
    
    &:hover {
      border-color: #409eff;
      color: #409eff;
    }
    
    .el-icon {
      font-size: 28px;
      margin-bottom: 8px;
    }
  }
  
  .preview {
    position: relative;
    width: 200px;
    height: 200px;
    border-radius: 6px;
    overflow: hidden;
    
    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
    
    .mask {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      opacity: 0;
      transition: opacity 0.3s;
      
      &:hover {
        opacity: 1;
      }
    }
  }
}

.image-slot {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  background: #f5f7fa;
  color: #909399;
}
</style>