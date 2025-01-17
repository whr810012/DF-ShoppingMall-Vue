<script setup lang="ts">
import { reactive, ref } from 'vue'
import { queryAllAdminApi, deleteAdminApi, updateAdminApi, addAdminApi } from '@/api/admin'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRouter } from 'vue-router'
import { useUserInfoStore } from '@/store'
import type { Employee, ApiResponse } from '@/types/employee'
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'
import { useLocale } from 'element-plus'

// ------ 数据 ------
const userInfoStore = useUserInfoStore()
const router = useRouter()

// 表格加载状态
const loading = ref(false)

// 当前页的管理员列表
const employeeList = ref<Employee[]>([])

// 查询参数
const pageData = reactive({
  name: '',
  total: 0,
  currentPage: 1,
  pageSize: 10
})

// 添加新的响应式数据
const dialogVisible = ref(false)
const addForm = reactive({
  adminName: '',
  account: '',
  password: '',
  sorct: 0,  // 固定为普通管理员
  status: 1  // 默认启用
})

// 表单校验规则
const rules = {
  adminName: [
    { required: true, trigger: 'blur', message: '不能为空' },
    { min: 2, message: '姓名长度不能少于2个字符', trigger: 'blur' },
    { max: 20, message: '姓名长度不能超过20个字符', trigger: 'blur' },
  ],
  account: [
    { required: true, trigger: 'blur', message: '不能为空' },
    { pattern: /^[a-zA-Z0-9]{1,10}$/, message: '用户名必须是1-10的字母数字', trigger: 'blur' }
  ],
  password: [
    { required: true, trigger: 'blur', message: '不能为空' },
    { pattern: /^\S{6,15}$/, message: '密码必须是6-15的非空字符', trigger: 'blur' }
  ]
}

const addFormRef = ref()

// ------ 方法 ------
// 获取管理员列表
const init = async () => {
  loading.value = true
  try {
    const { data: res } = await queryAllAdminApi()
    if (res.code === 1) {
      // 处理分页数据
      const start = (pageData.currentPage - 1) * pageData.pageSize
      const end = start + pageData.pageSize
      employeeList.value = res.data.slice(start, end)
      pageData.total = res.data.length
    }
  } catch (error) {
    console.error('获取管理员列表失败:', error)
    ElMessage.error('获取管理员列表失败')
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  pageData.currentPage = 1 // 搜索时重置页码
  if (!pageData.name) {
    init()
    return
  }
  
  // 前端搜索过滤
  const filteredList = employeeList.value.filter(item => 
    item.adminName.includes(pageData.name) || 
    item.account.includes(pageData.name)
  )
  const start = (pageData.currentPage - 1) * pageData.pageSize
  const end = start + pageData.pageSize
  employeeList.value = filteredList.slice(start, end)
  pageData.total = filteredList.length
}

// 修改管理员
const handleUpdate = (row: Employee) => {
  router.push({
    name: 'employee_update',
    query: { id: row.id }
  })
}

// 修改管理员状态
const handleStatusChange = async (row: Employee) => {
  // 添加自我状态修改检查
  if (row.id === userInfoStore.userInfo?.id) {
    ElMessage.warning('不能修改自己的状态')
    return
  }

  try {
    const newStatus = row.status === 1 ? 0 : 1
    await updateAdminApi({
      id: row.id,
      status: newStatus,
      account: row.account,
      adminName: row.adminName,
      createTime: row.createTime,
      password: row.password || '', // 如果没有密码字段则传空字符串
      sorct: row.sorct
    })
    ElMessage.success('状态修改成功')
    row.status = newStatus // 直接更新本地状态
  } catch (error) {
    console.error('修改状态失败:', error)
    ElMessage.error('修改状态失败')
    // 发生错误时回滚本地状态
    row.status = row.status === 1 ? 1 : 0
  }
}

// 删除管理员
const handleDelete = (row: Employee) => {
  // 添加自我删除检查
  if (row.id === userInfoStore.userInfo?.id) {
    ElMessage.warning('不能删除自己的账号')
    return
  }

  ElMessageBox.confirm(
    '该操作会永久删除管理员，是否继续？',
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(async () => {
    try {
      await deleteAdminApi([row.id])
      ElMessage.success('删除成功')
      init()
    } catch (error) {
      console.error('删除失败:', error)
      ElMessage.error('删除失败')
    }
  }).catch(() => {
    ElMessage.info('已取消删除')
  })
}

// 添加分页处理方法
const handleCurrentChange = (page: number) => {
  pageData.currentPage = page
  init()
}

const handleSizeChange = (size: number) => {
  pageData.pageSize = size
  pageData.currentPage = 1
  init()
}

// 设置 Element Plus 的语言为中文
const { locale } = useLocale()
locale.value = zhCn

// 在 script 部分添加权限判断的工具函数
const canEdit = (row: Employee) => {
  const currentUser = userInfoStore.userInfo
  if (!currentUser) return false
  // 超级管理员可以修改所有人
  if (currentUser.sorct === 1) return true
  // 普通管理员只能修改自己
  return currentUser.id === row.id
}

const canManage = (row?: Employee) => {
  const currentUser = userInfoStore.userInfo
  if (!currentUser) return false
  // 只有超级管理员可以管理其他用户
  if (currentUser.sorct !== 1) return false
  // 如果传入了row参数，则检查是否是自己
  if (row && currentUser.id === row.id) return false
  return true
}

// 添加新的方法
const handleAdd = () => {
  // 添加权限检查
  if (userInfoStore.userInfo?.sorct !== 1) {
    ElMessage.warning('只有超级管理员才能新增管理员')
    return
  }
  dialogVisible.value = true
}

const handleClose = () => {
  if (addFormRef.value) {
    addFormRef.value.resetFields()
    // 重置为初始值
    Object.assign(addForm, {
      adminName: '',
      account: '',
      password: '',
      sorct: 0,  // 保持为普通管理员
      status: 1
    })
  }
  dialogVisible.value = false
}

const submitAdd = async () => {
  if (!addFormRef.value) return
  
  await addFormRef.value.validate(async (valid: boolean) => {
    if (valid) {
      try {
        // 只提交需要的字段
        const submitData = {
          adminName: addForm.adminName,
          account: addForm.account,
          password: addForm.password,
          sorct: addForm.sorct,
          status: addForm.status
        }
        
        const res = await addAdminApi(submitData)
        if (res.data.code === 1) {
          ElMessage.success('添加管理员成功')
          handleClose()
          init() // 刷新列表
        }
      } catch (error) {
        return
      }
    }
  })
}

// 初始化
init()
</script>

<template>
  <div class="employee-container">
    <el-card class="box-card">
      <!-- 搜索栏 -->
      <div class="search-bar">
        <el-input
          v-model="pageData.name"
          placeholder="请输入管理员姓名/账号"
          clearable
          @clear="init"
          @keyup.enter="handleSearch"
        >
          <template #append>
            <el-button @click="handleSearch">
              <el-icon><Search /></el-icon>
            </el-button>
          </template>
        </el-input>

        <el-button 
          type="primary" 
          @click="handleAdd"
          :disabled="userInfoStore.userInfo?.sorct !== 1"
          :title="userInfoStore.userInfo?.sorct !== 1 ? '只有超级管理员才能新增管理员' : ''"
        >
          <el-icon><Plus /></el-icon>添加管理员
        </el-button>
      </div>

      <!-- 表格 -->
      <el-table
        :data="employeeList"
        stripe
        v-loading="loading"
        style="width: 100%"
      >
        <el-table-column type="index" label="序号" width="80" align="center"/>
        <el-table-column prop="adminName" label="姓名"/>
        <el-table-column prop="account" label="账号" />
        <el-table-column prop="createTime" label="创建时间"/>
        <el-table-column prop="sorct" label="角色" >
          <template #default="{ row }">
            <el-tag :type="row.sorct === 1 ? 'danger' : ''">
              {{ row.sorct === 1 ? '超级管理员' : '普通管理员' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'">
              {{ row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column align="center" label="操作" fixed="right" width="250">
          <template #default="{ row }">
            <el-button
              type="primary"
              link
              @click="handleUpdate(row)"
              :disabled="!canEdit(row)"
              :title="!canEdit(row) ? '无权限修改' : ''"
            >
              修改
            </el-button>
            <el-button
              type="primary"
              link
              @click="handleStatusChange(row)"
              :disabled="!canManage(row) || row.id === userInfoStore.userInfo?.id"
              :title="row.id === userInfoStore.userInfo?.id ? '不能修改自己的状态' : (!canManage() ? '仅超级管理员可操作' : '')"
            >
              {{ row.status === 1 ? '禁用' : '启用' }}
            </el-button>
            <el-button
              type="danger"
              link
              @click="handleDelete(row)"
              :disabled="!canManage(row)"
              :title="!canManage(row) ? (userInfoStore.userInfo?.id === row.id ? '不能删除自己' : '仅超级管理员可操作') : ''"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 分页组件 -->
      <el-pagination
        v-model:current-page="pageData.currentPage"
        v-model:page-size="pageData.pageSize"
        :page-sizes="[10, 20, 30, 50]"
        :total="pageData.total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        :pager-count="7"
        prev-text="上一页"
        next-text="下一页"
        :sizes-text="'条/页'"
        :total-text="'共 ' + pageData.total + ' 条'"
      />
    </el-card>

    <!-- 添加弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      title="添加管理员"
      width="500px"
      :close-on-click-modal="false"
      @close="handleClose"
    >
      <el-form
        ref="addFormRef"
        :model="addForm"
        :rules="rules"
        label-width="80px"
        status-icon
      >
        <el-form-item label="姓名" prop="adminName">
          <el-input v-model="addForm.adminName" placeholder="请输入管理员姓名" />
        </el-form-item>
        <el-form-item label="账号" prop="account">
          <el-input v-model="addForm.account" placeholder="请输入账号" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input
            v-model="addForm.password"
            type="password"
            show-password
            placeholder="请输入密码"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="handleClose">取消</el-button>
          <el-button type="primary" @click="submitAdd">确认</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="less" scoped>
.employee-container {
  padding: 20px;
  width: 100%;
  height: 100%;
  box-sizing: border-box;

  .box-card {
    height: 100%;
    // 移除默认内边距，使表格能完全撑满
    :deep(.el-card__body) {
      height: 100%;
      padding: 20px;
      box-sizing: border-box;
    }

    .search-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;

      .el-input {
        width: 300px;
      }
    }

    // 调整表格容器样式
    .el-table {
      margin-bottom: 24px;
      width: 100% !important; // 强制宽度100%
      
      :deep(.el-table__header) {
        th {
          background-color: #f5f7fa;
          font-weight: 600;
          color: #333;
        }
      }

      :deep(.el-table__row) {
        td {
          padding: 12px 0;
        }
      }
    }

    // 添加分页样式
    :deep(.el-pagination) {
      margin-top: 20px;
      justify-content: flex-end;
    }
  }
}

:deep(.el-table) {
  .cell {
    .el-button {
      padding: 4px 12px;
      margin-right: 12px;
      font-size: 13px;
      
      &:last-child {
        margin-right: 0;
      }

      &:hover {
        opacity: 0.8;
      }

      &.is-disabled {
        opacity: 0.5;
      }
    }
  }

  .el-tag {
    padding: 4px 8px;
    border-radius: 4px;
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 20px;
  border-top: 1px solid #dcdfe6;
  margin: 0 -20px;
  padding: 20px 20px 0;
}

:deep(.el-dialog) {
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  
  .el-dialog__header {
    margin: 0;
    padding: 20px 24px;
    border-bottom: 1px solid #ebeef5;
    
    .el-dialog__title {
      font-size: 16px;
      font-weight: 600;
      color: #303133;
    }

    .el-dialog__headerbtn {
      top: 20px;
      right: 20px;
      
      .el-dialog__close {
        font-size: 18px;
        color: #909399;
        
        &:hover {
          color: #409eff;
        }
      }
    }
  }
  
  .el-dialog__body {
    padding: 32px 24px;
    
    .el-form {
      .el-form-item {
        margin-bottom: 24px;
        
        &:last-child {
          margin-bottom: 0;
        }
        
        .el-form-item__label {
          padding-right: 12px;
          font-weight: 500;
          color: #606266;
        }
        
        .el-form-item__content {
          .el-input {
            .el-input__wrapper {
              padding: 1px 15px;
              box-shadow: 0 0 0 1px #dcdfe6 inset;
              transition: all 0.2s;
              
              &:hover {
                box-shadow: 0 0 0 1px #c0c4cc inset;
              }
              
              &.is-focus {
                box-shadow: 0 0 0 1px #409eff inset;
              }
              
              .el-input__inner {
                height: 36px;
                line-height: 36px;
                color: #606266;
                
                &::placeholder {
                  color: #c0c4cc;
                }
              }
            }
          }
        }
      }
    }
  }
  
  .el-dialog__footer {
    padding: 0 24px 24px;
    
    .dialog-footer {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding-top: 20px;
      border-top: 1px solid #ebeef5;
      margin: 0 -24px;
      padding: 20px 24px 0;
      
      .el-button {
        min-width: 88px;
        padding: 8px 20px;
        font-size: 14px;
        border-radius: 4px;
        transition: all 0.3s;
        
        &.el-button--primary {
          background-color: #409eff;
          border-color: #409eff;
          
          &:hover {
            background-color: #66b1ff;
            border-color: #66b1ff;
            transform: translateY(-1px);
            box-shadow: 0 2px 6px rgba(64, 158, 255, 0.2);
          }
          
          &:active {
            transform: translateY(0);
          }
        }
        
        &.el-button--default {
          &:hover {
            background-color: #f5f7fa;
            border-color: #dcdfe6;
            color: #606266;
            transform: translateY(-1px);
          }
          
          &:active {
            transform: translateY(0);
          }
        }
      }
    }
  }
}
</style>