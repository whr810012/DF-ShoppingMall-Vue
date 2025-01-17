<script setup lang="ts">

import { reactive, ref } from 'vue'
import { addGoodsApi, updateGoodsApi, deleteGoodsApi, getGoodsDetailApi, getGoodsListApi } from '@/api/goods'
import { getSortListApi } from '@/api/sort'
import { ElMessage, ElMessageBox, ElTable } from 'element-plus'
import { useRouter } from 'vue-router'
import { Search, Delete, Plus, Edit, Picture, SwitchButton, Refresh } from '@element-plus/icons-vue'

// ------ .d.ts 属性类型接口 ------
interface dish {
  id: number
  name: string
  avatar: string[]
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

// 新增和修改菜品都是同一个页面，不过要根据路径传参的方式来区分
const router = useRouter()
const to_add_update = (row?: any) => {
  console.log('看有没有传过来，来判断要add还是update', row)
  if (row && row.id) {
    router.push({
      path: '/dish/add',
      query: { id: row.id }
    })
  } else {
    router.push('/dish/add')
  }
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
    
    // 处理图片数组
    if (row.avatar && row.avatar.length > 0) {
      row.avatar.forEach((url: string) => {
        formData.append('avatar', url)
      })
    }

    console.log('更新数据:', formData)
    const res = await updateGoodsApi(formData)
    if (res.data.code === 0) {
      ElMessage({
        type: 'success',
        message: `${row.status === 1 ? '下架' : '上架'}成功`,
      })
      init()
    }
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
          if (res.data.code === 0) {
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
          if (res.data.code === 0) {
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
      <el-table-column prop="avatar" label="图片" align="center" width="100">
        <template #default="scope">
          <el-image 
            v-if="scope.row.avatar && scope.row.avatar.length > 0" 
            :src="scope.row.avatar[0]" 
            :preview-src-list="scope.row.avatar"
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