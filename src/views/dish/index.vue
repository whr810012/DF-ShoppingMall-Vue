<script setup lang="ts">

import { reactive, ref } from 'vue'
import { addGoodsApi, updateGoodsApi, deleteGoodsApi, getGoodsDetailApi, getGoodsListApi } from '@/api/goods'
import { getSortListApi } from '@/api/sort'
import { ElMessage, ElMessageBox, ElTable } from 'element-plus'
import { useRouter } from 'vue-router'
import { Search, Delete, Plus, Edit, Picture, SwitchButton, Refresh } from '@element-plus/icons-vue'

// ------ .d.ts 属性类型接口 ------
interface AvatarItem {
  id: number
  avatar: string
}

interface dish {
  id: number
  name: string
  avatar: AvatarItem[]
  present: string
  price: number
  discount: number
  number: number
  status: number
  sortId: number | null
  createTime: string
}

interface Category {
  id: number
  name: string
}


// ------ 数据 ------

// 当前页的菜品列表
const dishList = ref<dish[]>([])
// 所有菜品列表
const allDishList = ref<dish[]>([])
// 菜品id对应的分类列表，即categoryId字段不能只展示id值，应该根据id查询到对应的分类名进行回显
const categoryList = ref<Category[]>([])
// 分页参数
const pageData = reactive({
  name: '',
  sortId: '',
  status: '',
  page: 1,
  pageSize: 10,
})
const total = ref(0)
const options = [
  {
    value: 1,
    label: '上架',
  },
  {
    value: 0,
    label: '下架',
  }
]

// 弹窗相关数据
const router = useRouter()
const dialogVisible = ref(false)
const dialogTitle = ref('新增商品')
const isEdit = ref(false)
const formData = reactive({
  id: null as number | null,
  name: '',
  present: '',
  price: 0,
  number: 0,
  sortId: null as number | null,
  status: 1,  // 默认上架状态
  avatar: [] as File[],
  discount: 1 // 默认不打折
})

// 图片上传相关
const fileList = ref<any[]>([])
const oldImages = ref<string[]>([]) // 用于存储修改时的原有图片

const handleFileChange = (uploadFile: any) => {
  console.log('uploadFile:', uploadFile)
  
  if (fileList.value.length >= 3) {
    ElMessage.warning('最多只能上传3张图片')
    return
  }

  const file = uploadFile.raw
  if (!file) {
    ElMessage.error('文件上传失败')
    return
  }
  
  // 验证文件类型
  const isImage = file.type.startsWith('image/')
  if (!isImage) {
    ElMessage.error('只能上传图片文件')
    return
  }
  
  // 验证文件大小（限制为2MB）
  const isLt2M = file.size / 1024 / 1024 < 2
  if (!isLt2M) {
    ElMessage.error('图片大小不能超过2MB')
    return
  }

  // 创建预览URL
  const url = URL.createObjectURL(file)
  fileList.value.push({
    name: file.name,
    url: url
  })
  formData.avatar.push(file)
}

const handleRemove = (file: any) => {
  const index = fileList.value.findIndex(item => item.url === file.url)
  if (index !== -1) {
    fileList.value.splice(index, 1)
    formData.avatar.splice(index, 1)
    // 如果是预览URL，需要释放
    URL.revokeObjectURL(file.url)
  }
}

// 修改打开新增/编辑商品的方法
const to_add_update = async (row?: any) => {
  resetForm()
  if (row && row.id) {
    isEdit.value = true
    dialogTitle.value = '修改商品'
    // 获取商品详情
    const { data: res } = await getGoodsDetailApi(row.id)
    if (res.code === 1) {
      // 填充表单数据
      formData.id = res.data.id
      formData.name = res.data.name
      formData.present = res.data.present
      formData.price = res.data.price
      formData.number = res.data.number
      formData.sortId = res.data.sortId
      formData.status = res.data.status
      formData.discount = res.data.discount
      
      // 处理图片
      if (res.data.ditysrc && res.data.ditysrc.length > 0) {
        oldImages.value = [...res.data.ditysrc.map(item => {
          return {
            url: item.url,
            id: item.eid
          }}
        )] // 保存原有图片URL
        // oldImages.value = [...res.data.ditysrc.map(item => {
        //   return {
        //     url: item.url,
        //     id: item.eid
        //   }}
        // )] // 保存原有图片URL
        // 将图片URL转换为展示用的fileList
        fileList.value = res.data.ditysrc.map(item => ({
          url: item.url,
          name: item.url.split('/').pop() || '',
          isNew: false // 标记为原有图片
        }))
      }
    }
  } else {
    isEdit.value = false
    dialogTitle.value = '新增商品'
  }
  dialogVisible.value = true
}

// 提交表单
const submitForm = async () => {
  try {
    // 表单验证
    if (!formData.name.trim()) {
      ElMessage.warning('请输入商品名称')
      return
    }
    if (!formData.present.trim()) {
      ElMessage.warning('请输入商品描述')
      return
    }
    if (formData.price <= 0) {
      ElMessage.warning('请输入正确的商品价格')
      return
    }
    if (formData.number < 0) {
      ElMessage.warning('请输入正确的库存数量')
      return
    }
    if (!isEdit.value && formData.avatar.length === 0) {
      ElMessage.warning('请上传商品图片')
      return
    }

    const form = new FormData()
    if (isEdit.value && formData.id) {
      form.append('id', formData.id.toString())
    }
    form.append('name', formData.name.trim())
    form.append('present', formData.present.trim())
    form.append('price', formData.price.toString())
    form.append('number', formData.number.toString())
    form.append('discount', formData.discount.toString())
    if (formData.sortId) {
      form.append('sortId', formData.sortId.toString())
    }
    form.append('status', formData.status.toString())
    
    // 处理图片
    if (isEdit.value) {
      // 修改时：添加原有图片的URL数组
      // form.append('avatar', JSON.stringify(oldImages.value))
      // 判断删除了那些照片
      console.log(fileList)
      const deletedImages = oldImages.value.filter(oldImage => {
        return !formData.avatar.some(newImage => newImage.id === oldImage.id)
      }).map(item => item.id)
      if (deletedImages.length > 0) {
        form.append('ids', JSON.stringify(deletedImages))
      }
      // 添加删除图片的请求参数
      // 添加新上传的图片文件
      // 添加新上传的图片文件
      formData.avatar.forEach((file, index) => {
        form.append('image', file, `image${index + 1}.${file.name.split('.').pop()}`)
      })
    } else {
      // 新增时：只处理新上传的图片
      formData.avatar.forEach((file, index) => {
        form.append('image', file, `image${index + 1}.${file.name.split('.').pop()}`)
      })
    }

    const { data: res } = isEdit.value ? 
      await updateGoodsApi(form) : 
      await addGoodsApi(form)
    
    if (res.code === 1) {
      ElMessage.success(isEdit.value ? '修改商品成功' : '添加商品成功')
      dialogVisible.value = false
      resetForm()
      init()
    } else {
      ElMessage.error(res.msg || (isEdit.value ? '修改商品失败' : '添加商品失败'))
    }
  } catch (error) {
    console.error(isEdit.value ? '修改商品失败:' : '添加商品失败:', error)
    ElMessage.error(isEdit.value ? '修改商品失败' : '添加商品失败')
  }
}

// 重置表单
const resetForm = () => {
  formData.id = null
  formData.name = ''
  formData.present = ''
  formData.price = 0
  formData.number = 0
  formData.sortId = null
  formData.status = 1
  formData.discount = 1
  // 清理预览URL
  fileList.value.forEach(file => {
    if (file.url.startsWith('blob:')) {
      URL.revokeObjectURL(file.url)
    }
  })
  fileList.value = []
  formData.avatar = []
  oldImages.value = []
  isEdit.value = false
}

// ------ 方法 ------

// 刷新页面数据
const showPageList = async () => {
  const { data: res } = await getGoodsListApi()
  console.log('商品列表')
  console.log(res.data)
  // 保存所有数据
  allDishList.value = res.data
  // 根据筛选条件过滤数据
  let filteredList = allDishList.value
  if (pageData.name) {
    filteredList = filteredList.filter(item => item.name.includes(pageData.name))
  }
  if (pageData.sortId) {
    console.log('筛选分类:', pageData.sortId)
    filteredList = filteredList.filter(item => {
      console.log('商品sortId:', item.sortId)
      return Number(item.sortId) === Number(pageData.sortId)
    })
  }
  if (pageData.status !== '') {
    filteredList = filteredList.filter(item => item.status === Number(pageData.status))
  }
  // 更新总数
  total.value = filteredList.length
  // 计算当前页数据
  const start = (pageData.page - 1) * pageData.pageSize
  const end = start + pageData.pageSize
  dishList.value = filteredList.slice(start, end)
}

// 页面初始化
const init = async () => {
  // 获取分类列表
  const { data: res_category } = await getSortListApi()
  console.log('分类列表')
  console.log(res_category.data)
  categoryList.value = res_category.data
  console.log('categoryList: ', categoryList.value)
  
  // 获取菜品列表
  await showPageList()
}

// 页面初始化时执行
init() // 页面初始化时只调用一次init，由init内部调用showPageList

// 监听翻页和每页显示数量的变化
const handleCurrentChange = (val: number) => {
  pageData.page = val
  // 直接从allDishList中获取对应页的数据
  const start = (pageData.page - 1) * pageData.pageSize
  const end = start + pageData.pageSize
  let filteredList = allDishList.value
  if (pageData.name) {
    filteredList = filteredList.filter(item => item.name.includes(pageData.name))
  }
  if (pageData.sortId) {
    filteredList = filteredList.filter(item => Number(item.sortId) === Number(pageData.sortId))
  }
  if (pageData.status) {
    filteredList = filteredList.filter(item => item.status === Number(pageData.status))
  }
  dishList.value = filteredList.slice(start, end)
}

const handleSizeChange = (val: number) => {
  pageData.pageSize = val
  // 直接从allDishList中获取对应页的数据
  const start = (pageData.page - 1) * pageData.pageSize
  const end = start + pageData.pageSize
  let filteredList = allDishList.value
  if (pageData.name) {
    filteredList = filteredList.filter(item => item.name.includes(pageData.name))
  }
  if (pageData.sortId) {
    filteredList = filteredList.filter(item => Number(item.sortId) === Number(pageData.sortId))
  }
  if (pageData.status) {
    filteredList = filteredList.filter(item => item.status === Number(pageData.status))
  }
  dishList.value = filteredList.slice(start, end)
}

const multiTableRef = ref<InstanceType<typeof ElTable>>()
const multiSelection = ref<dish[]>([])

const handleSelectionChange = (val: dish[]) => {
  multiSelection.value = val
  console.log('value', val)
  console.log('multiSelection.value', multiSelection.value)
}

// 修改菜品状态
const change_btn = async (row: any) => {
  try {
    console.log('要修改的行数据:', row)
    // 构造FormData数据
    const formData = new FormData()
    formData.append('id', row.id.toString())
    formData.append('name', row.name)
    formData.append('discount', row.discount.toString())
    formData.append('number', row.number.toString())
    formData.append('present', row.present)
    formData.append('price', row.price.toString())
    formData.append('sortId', row.sortId ? row.sortId.toString() : '')
    formData.append('status', row.status === 1 ? '0' : '1')  // 切换状态
    

    console.log('更新数据:', formData)
    await updateGoodsApi(formData).then(res =>{
      if (res.data.code === 1) {
      ElMessage({
        type: 'success',
        message: `${row.status === 1 ? '下架' : '上架'}成功`,
      })
      init()
    }
    })
  } catch (error) {
    console.error('更新失败:', error)
    ElMessage({
      type: 'error',
      message: '更新失败',
    })
  }
}

// 删除菜品
const deleteBatch = (row?: any) => {
  console.log('要删除的行数据')
  console.log(row)
  ElMessageBox.confirm(
    '该操作会永久删除商品，是否继续？',
    'Warning',
    {
      confirmButtonText: 'OK',
      cancelButtonText: 'Cancel',
      type: 'warning',
    }
  )
    .then(async () => {
      try {
        // 1. 没传入行数据，批量删除
        if (row == undefined) {
          console.log(multiSelection.value)
          if (multiSelection.value.length == 0) {
            ElMessage({
              type: 'warning',
              message: '请先选择要删除的商品',
            })
            return
          }
          // 拿到当前 multiSelection.value 的所有id，然后调用批量删除接口
          let ids: number[] = []
          multiSelection.value.map(item => {
            ids.push(item.id)
          })
          console.log('批量删除ids:', ids)
          const res = await deleteGoodsApi(ids)
          if (res.data.code === 1) {
            ElMessage({
              type: 'success',
              message: '删除成功',
            })
            init()
          }
        }
        // 2. 传入行数据，单个删除
        else {
          console.log('单个删除id:', [row.id])
          const res = await deleteGoodsApi([row.id])
          if (res.data.code === 1) {
            ElMessage({
              type: 'success',
              message: '删除成功',
            })
            init()
          }
        }
      } catch (error) {
        console.error('删除失败:', error)
        ElMessage({
          type: 'error',
          message: '删除失败',
        })
      }
    })
    .catch(() => {
      ElMessage({
        type: 'info',
        message: '取消删除',
      })
    })
}

// 获取分类名称的方法
const getCategoryName = (sortId: number | null): string => {
  console.log('当前商品sortId:', sortId)
  console.log('可用分类列表:', categoryList.value)
  if (!sortId) return '未分类'
  const category = categoryList.value.find(item => item.id === sortId)
  console.log('匹配到的分类:', category)
  return category ? category.name : '未分类'
}

// 重置搜索条件
const resetSearch = () => {
  pageData.name = ''
  pageData.sortId = ''
  pageData.status = ''
  pageData.page = 1
  init()  // 这里也改为调用init
}

// 添加计算属性来处理图片预览列表
const getPreviewImages = (avatar: AvatarItem[]) => {
  return avatar.map(item => item.avatar)
}
</script>

<template>
  <el-card class="container">
    <div class="header">
      <div class="search-area">
        <el-input 
          size="default" 
          class="search-input" 
          v-model="pageData.name" 
          placeholder="请输入商品名称"
          clearable
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-select 
          size="default" 
          class="search-select" 
          clearable 
          v-model="pageData.sortId" 
          placeholder="商品分类"
        >
          <el-option v-for="item in categoryList" :key="item.id" :label="item.name" :value="item.id" />
        </el-select>
        <el-select 
          size="default" 
          class="search-select" 
          clearable 
          v-model="pageData.status" 
          placeholder="商品状态"
        >
          <el-option v-for="item in options" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
        <el-button-group>
          <el-button type="primary" @click="showPageList()">
            <el-icon><Search /></el-icon>搜索
          </el-button>
          <el-button type="info" @click="resetSearch()">
            <el-icon><Refresh /></el-icon>重置
          </el-button>
        </el-button-group>
      </div>
      <div class="action-area">
        <el-button-group>
          <el-button type="danger" @click="deleteBatch()">
            <el-icon><Delete /></el-icon>批量删除
          </el-button>
          <el-button type="success" @click="to_add_update()">
            <el-icon><Plus /></el-icon>新增商品
          </el-button>
        </el-button-group>
      </div>
    </div>

    <el-table 
      class="table_box" 
      ref="multiTableRef" 
      :data="dishList" 
      stripe 
      @selection-change="handleSelectionChange"
      :header-cell-style="{
        background: '#f5f7fa',
        color: '#606266',
        fontWeight: 'bold'
      }"
    >
      <el-table-column type="selection" width="55" />
      <el-table-column prop="name" label="商品名" align="center" min-width="120" />
      <el-table-column prop="dityUrl" label="图片" align="center" width="100">
        <template #default="scope">
          <el-image 
            v-if="scope.row.dityUrl && scope.row.dityUrl.length > 0" 
            :src="scope.row.dityUrl[0].avatar" 
            :preview-src-list="getPreviewImages(scope.row.dityUrl)"
            fit="cover"
            class="table-image"
          >
            <template #error>
              <div class="image-error">
                <el-icon><Picture /></el-icon>
              </div>
            </template>
          </el-image>
          <div v-else class="image-error">
            <el-icon><Picture /></el-icon>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="present" label="详情" min-width="200" align="center" show-overflow-tooltip />
      <el-table-column prop="price" label="价格" align="center" width="100">
        <template #default="scope">
          <span class="price">￥{{ scope.row.price }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="discount" label="折扣" align="center" width="100">
        <template #default="scope">
          <el-tag type="warning" effect="plain">{{ scope.row.discount }}折</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="number" label="库存" align="center" width="80">
        <template #default="scope">
          <el-tag :type="scope.row.number > 10 ? 'success' : 'danger'" effect="plain">
            {{ scope.row.number }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" align="center" width="80">
        <template #default="scope">
          <el-tag :type="scope.row.status === 1 ? 'success' : 'danger'" effect="dark">
            {{ scope.row.status === 1 ? '上架' : '下架' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="sortId" label="所属分类" align="center" width="120">
        <template #default="scope">
          <el-tag effect="plain" :type="scope.row.sortId ? '' : 'info'">
            {{ getCategoryName(scope.row.sortId) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createTime" label="创建时间" width="180" align="center" />
      <el-table-column label="操作" width="200" align="center" fixed="right">
        <template #default="scope">
          <el-button @click="to_add_update(scope.row)" type="primary" link>
            <el-icon><Edit /></el-icon>修改
          </el-button>
          <el-button @click="change_btn(scope.row)" :type="scope.row.status === 1 ? 'danger' : 'success'" link>
            <el-icon><SwitchButton /></el-icon>{{ scope.row.status === 1 ? '下架' : '上架' }}
          </el-button>
          <el-button @click="deleteBatch(scope.row)" type="danger" link>
            <el-icon><Delete /></el-icon>删除
          </el-button>
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
      :page-sizes="[10, 20, 30, 50]" 
      v-model:current-page="pageData.page" 
      v-model:page-size="pageData.pageSize"
      @current-change="handleCurrentChange" 
      @size-change="handleSizeChange" 
    />

    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="50%"
      @close="resetForm"
    >
      <el-form :model="formData" label-width="100px">
        <el-form-item label="商品名称" required>
          <el-input v-model="formData.name" placeholder="请输入商品名称" />
        </el-form-item>
        <el-form-item label="商品描述" required>
          <el-input
            v-model="formData.present"
            type="textarea"
            :rows="3"
            placeholder="请输入商品描述"
          />
        </el-form-item>
        <el-form-item label="商品价格" required>
          <el-input-number
            v-model="formData.price"
            :min="0"
            :precision="2"
            :step="0.1"
          />
        </el-form-item>
        <el-form-item label="折扣" required>
          <el-input-number
            v-model="formData.discount"
            :min="0"
            :max="10"
            :precision="1"
            :step="0.1"
          />
        </el-form-item>
        <el-form-item label="库存数量" required>
          <el-input-number
            v-model="formData.number"
            :min="0"
            :step="1"
          />
        </el-form-item>
        <el-form-item label="商品分类">
          <el-select v-model="formData.sortId" placeholder="请选择商品分类" clearable>
            <el-option
              v-for="item in categoryList"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="商品图片" :required="!isEdit">
          <el-upload
            class="upload-demo"
            action="#"
            :auto-upload="false"
            :show-file-list="true"
            :file-list="fileList"
            :on-change="handleFileChange"
            :on-remove="handleRemove"
            :before-upload="() => false"
            accept="image/jpeg,image/png,image/gif"
            multiple
            list-type="picture-card"
          >
            <template #default>
              <el-icon><Plus /></el-icon>
              <div class="el-upload__text">点击上传</div>
            </template>
          </el-upload>
          <div class="el-upload__tip">
            只能上传jpg/png/gif文件，且不超过2MB，最多3张
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitForm">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </el-card>
</template>

<style lang="less" scoped>
.container {
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.1);

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding: 16px;
    background: #f8f9fa;
    border-radius: 8px;

    .search-area {
      display: flex;
      gap: 12px;
      align-items: center;
      flex-wrap: wrap;

      .search-input {
        width: 220px;
        :deep(.el-input__wrapper) {
          box-shadow: 0 0 0 1px #dcdfe6 inset;
          &:hover {
            box-shadow: 0 0 0 1px #409eff inset;
          }
          &.is-focus {
            box-shadow: 0 0 0 1px #409eff inset;
          }
        }
      }

      .search-select {
        width: 140px;
        :deep(.el-input__wrapper) {
          box-shadow: 0 0 0 1px #dcdfe6 inset;
          &:hover {
            box-shadow: 0 0 0 1px #409eff inset;
          }
          &.is-focus {
            box-shadow: 0 0 0 1px #409eff inset;
          }
        }
      }

      :deep(.el-button-group) {
        .el-button {
          margin-left: 0;
          .el-icon {
            margin-right: 4px;
          }
        }
      }
    }

    .action-area {
      :deep(.el-button-group) {
        .el-button {
          margin-left: 0;
          .el-icon {
            margin-right: 4px;
          }
        }
      }
    }
  }

  .table_box {
    margin: 20px 0;
    
    :deep(.el-table__header) {
      font-weight: bold;
    }

    .table-image {
      width: 60px;
      height: 60px;
      border-radius: 6px;
      object-fit: cover;
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

      .el-icon {
        font-size: 24px;
      }
    }

    .price {
      color: #f56c6c;
      font-weight: bold;
    }
  }

  .pagination {
    margin-top: 20px;
    display: flex;
    justify-content: center;
  }

  .dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
  }

  .upload-demo {
    :deep(.el-upload--picture-card) {
      width: 120px;
      height: 120px;
      line-height: 130px;
    }
    
    :deep(.el-upload-list--picture-card) {
      .el-upload-list__item {
        width: 120px;
        height: 120px;
      }
      .el-upload-list__item-thumbnail {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    }

    .el-upload__text {
      margin-top: 8px;
      color: #606266;
      font-size: 12px;
      text-align: center;
    }
  }
}

// 响应式布局
@media screen and (max-width: 1200px) {
  .container {
    .header {
      flex-direction: column;
      gap: 16px;

      .search-area {
        width: 100%;
        justify-content: center;
      }

      .action-area {
        width: 100%;
        display: flex;
        justify-content: center;
      }
    }
  }
}
</style>