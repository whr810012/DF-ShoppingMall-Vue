<script lang="ts" setup>
import { reactive, ref } from 'vue'
import { queryAdminApi, updateAdminApi } from '@/api/admin'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserInfoStore } from '@/store'

// ------ 数据 ------
let userInfoStore = useUserInfoStore()

const formLabelWidth = '60px'
const id = ref()
const form = reactive({
  id: 0,
  adminName: '',
  account: '',
  password: '',
  status: 1,
  sorct: 0,
  createTime: ''
})
const genders = [
  {
    value: 1,
    label: '男',
  },
  {
    value: 0,
    label: '女',
  }
]
const inputRef1 = ref<HTMLInputElement | null>(null)
const updateRef = ref()

// 表单校验
const checkAge = (rule: any, value: string, callback: (error?: Error) => void) => {
  if (value === '' || value === undefined) {
    callback(new Error('请输入年龄'));
  } else if (!/^\d+$/.test(value)) {
    callback(new Error('年龄必须为数字'));
  } else {
    const age = parseInt(value);
    if (age < 3) {
      callback(new Error('年龄不能小于3岁'));
    } else if (age > 99) {
      callback(new Error('年龄不能大于99岁'));
    } else {
      callback();
    }
  }
}
const rules = {
  adminName: [
    { required: true, trigger: 'blur', message: '不能为空' },
    { min: 2, message: '姓名长度不能少于2个字符', trigger: 'blur' },
    { max: 20, message: '姓名长度不能超过20个字符', trigger: 'blur' },
  ],
  password: [
    { required: true, trigger: 'blur', message: '不能为空' },
    { pattern: /^\S{6,15}$/, message: '密码必须是6-15的非空字符', trigger: 'blur' }
  ]
}


// ------ 方法 ------

const router = useRouter()
const route = useRoute()

// 选择图片->点击事件->让选择框出现
const chooseImg = () => {
  // 模拟点击input框的行为，通过点击按钮触发另一个input框的事件，移花接木
  // 否则直接调用input框，其样式不太好改    input框中有个inputRef1属性，让inputRef1去click模拟点击行为
  if (inputRef1.value) {
    inputRef1.value.click() // 当input框的type是file时，click()方法会触发选择文件的对话框(弹出文件管理器)
  }
}

// 在文件管理器中选择图片后触发的改变事件：预览
const onFileChange1 = (e: Event) => {
  // 获取用户选择的文件列表（伪数组）
  console.log(e)
  const target = e.target as HTMLInputElement
  const files = target.files;
  if (files && files.length > 0) {
    // 选择了图片
    console.log(files[0])
    // 文件 -> base64字符串  (可以发给后台)
    // 1. 创建 FileReader 对象
    const fr = new FileReader()
    // 2. 调用 readAsDataURL 函数，读取文件内容
    fr.readAsDataURL(files[0])
    // 3. 监听 fr 的 onload 事件，文件转为base64字符串成功后会触发该事件
    fr.onload = () => {
      // 4. 通过 e.target.result 获取到读取的结果，值是字符串（base64 格式的字符串）
      form.pic = fr.result as string
      console.log('avatar')
      console.log(form.pic)
    }
  }
}

// 修改管理员信息后提交（只有管理员才能对其他管理员进行修改，否则普通管理员只能对自己进行修改）
const submit = async () => {
  try {
    const valid = await updateRef.value.validate();
    if (valid) {
      const res = await updateAdminApi({
        id: form.id,
        adminName: form.adminName,
        account: form.account,
        password: form.password,
        status: form.status,
        sorct: form.sorct,
        createTime: form.createTime
      })
      
      if (res.data.code !== 1) {
        return false
      }

      // 如果修改的是当前用户信息，更新store
      if (userInfoStore.userInfo && userInfoStore.userInfo.id === form.id) {
        const { data: admin } = await queryAdminApi(form.id)
        if (userInfoStore.userInfo) {
          userInfoStore.userInfo.account = admin.data.account
        }
      }

      ElMessage({
        message: '修改管理员信息成功',
        type: 'success',
        duration: 2000  // 显示2秒
      })
      
      // 重新获取最新数据
      init()
    }
  } catch (error) {
    console.error('修改失败:', error)
    ElMessage.error('修改失败')
  }
}
// 取消修改
const cancel = () => {
  router.push({
    path: '/employee',
  })
}

const init = async () => {
  if (route.query.id) {
    id.value = route.query.id
    form.id = Number(id.value)
    try {
      const { data: res } = await queryAdminApi(form.id)
      if (res.code === 1) {
        // 直接使用接口返回的数据结构
        Object.assign(form, res.data)
      }
    } catch (error) {
      console.error('获取管理员信息失败:', error)
      ElMessage.error('获取管理员信息失败')
    }
  }
}

init()
</script>

<template>
  <div class="update-container">
    <h1>修改管理员信息</h1>
    <el-card>
      <el-form :model="form" :rules="rules" ref="updateRef">
        <el-form-item label="姓名" prop="adminName">
          <el-input v-model="form.adminName" placeholder="请输入管理员姓名" />
        </el-form-item>
        <el-form-item label="账号" prop="account">
          <el-input 
            v-model="form.account" 
            disabled 
            placeholder="账号不可修改" 
          />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input 
            v-model="form.password" 
            type="password" 
            show-password 
            placeholder="请输入密码"
          />
        </el-form-item>
        <el-form-item label="角色">
          <el-tag 
            :type="form.sorct === 1 ? 'danger' : 'info'"
            effect="plain"
            class="status-tag"
          >
            {{ form.sorct === 1 ? '超级管理员' : '普通管理员' }}
          </el-tag>
        </el-form-item>
        <el-form-item label="状态">
          <el-tag 
            :type="form.status === 1 ? 'success' : 'danger'"
            effect="plain"
            class="status-tag"
          >
            {{ form.status === 1 ? '启用' : '禁用' }}
          </el-tag>
        </el-form-item>
        <el-form-item label="创建时间">
          <span>{{ form.createTime }}</span>
        </el-form-item>
      </el-form>
      <div class="btn-container">
        <el-button class="submit-btn" type="success" @click="submit">确认修改</el-button>
        <el-button class="cancel-btn" @click="cancel">取消</el-button>
      </div>
    </el-card>
  </div>
</template>

<style lang="less" scoped>
.update-container {
  padding: 24px;
  background-color: #f5f7fa;
  min-height: 100vh;
  
  h1 {
    font-size: 22px;
    font-weight: 600;
    color: #1f2f3d;
    margin-bottom: 24px;
    padding-left: 4px;
  }

  .el-card {
    max-width: 580px;
    margin: 0 auto;
    border-radius: 8px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
    
    :deep(.el-card__body) {
      padding: 32px 40px;
    }

    .el-form {
      .el-form-item {
        margin-bottom: 28px;

        &:last-child {
          margin-bottom: 0;
        }

        // 调整label样式
        :deep(.el-form-item__label) {
          font-weight: 500;
          color: #606266;
          width: 90px !important;  // 统一label宽度
          padding-right: 16px;
        }

        // 输入框样式
        :deep(.el-input) {
          .el-input__wrapper {
            padding: 1px 15px;
            border-radius: 4px;
            transition: all 0.2s;
            box-shadow: 0 0 0 1px #dcdfe6 inset;
            
            &:hover {
              box-shadow: 0 0 0 1px #c0c4cc inset;
            }
            
            &.is-focus {
              box-shadow: 0 0 0 1px #409eff inset;
            }

            .el-input__inner {
              height: 36px;
              line-height: 36px;
              font-size: 14px;
              
              &::placeholder {
                color: #c0c4cc;
              }
            }
          }
        }

        // 标签样式
        .status-tag {
          padding: 6px 16px;
          font-size: 13px;
          border-radius: 4px;
          font-weight: normal;
          height: 32px;
          line-height: 20px;  // 调整行高
          display: inline-flex;  // 使用 flex 布局
          align-items: center;  // 垂直居中
          justify-content: center;  // 水平居中
          
          &.el-tag--danger {
            color: #f56c6c;
            background-color: #fef0f0;
            border-color: #fde2e2;
          }
          
          &.el-tag--success {
            color: #67c23a;
            background-color: #f0f9eb;
            border-color: #e1f3d8;
          }
          
          &.el-tag--info {
            color: #909399;
            background-color: #f4f4f5;
            border-color: #e9e9eb;
          }
        }

        // 创建时间样式
        span {
          color: #606266;
          font-size: 14px;
          line-height: 36px;
          display: inline-block;
        }

        // 禁用输入框样式
        :deep(.el-input.is-disabled) {
          .el-input__wrapper {
            background-color: #f5f7fa;
            box-shadow: 0 0 0 1px #e4e7ed inset;
            cursor: not-allowed;
            
            .el-input__inner {
              color: #909399;
              -webkit-text-fill-color: #909399;
              cursor: not-allowed;
            }
            
            &:hover {
              box-shadow: 0 0 0 1px #e4e7ed inset;
            }
          }
        }

        :deep(.el-form-item__content) {
          min-height: 36px;
          display: flex;
          align-items: center;
        }
      }
    }

    // 按钮容器样式
    .btn-container {
      display: flex;
      justify-content: center;
      gap: 24px;
      margin-top: 48px;
      padding-top: 24px;
      border-top: 1px solid #ebeef5;

      .el-button {
        min-width: 120px;
        padding: 12px 24px;
        font-size: 14px;
        border-radius: 4px;
        transition: all 0.3s;
        
        &.submit-btn {
          background-color: #67c23a;
          border-color: #67c23a;
          
          &:hover {
            background-color: #85ce61;
            border-color: #85ce61;
            transform: translateY(-1px);
            box-shadow: 0 2px 6px rgba(103, 194, 58, 0.2);
          }
          
          &:active {
            transform: translateY(0);
          }
        }
        
        &.cancel-btn {
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
