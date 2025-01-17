<script setup lang="ts">
import { reactive, ref, computed } from 'vue'
import { getSeckillListApi, deleteSeckillApi, updateSeckillApi } from '@/api/miaosha'
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
    router.push('/seckill/add')
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
        if (res.data.code != 0) return
      }
      // 2. 传入行数据，单个删除
      else {
        let res = await deleteSeckillApi([row.id])
        if (res.data.code != 0) return
      }
      // 删除后刷新页面，更新数据
      showPageList()
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
            fit="cover"
            class="product-image"
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
</template>

<style lang="less" scoped>
.seckill-card {
  margin: 20px;
  border-radius: 8px;

  .filter-section {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    flex-wrap: wrap;
    gap: 20px;

    .filter-inputs {
      display: flex;
      gap: 15px;
      flex-wrap: wrap;

      .input {
        width: 200px;
      }
    }

    .filter-buttons {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;

      .btn {
        min-width: 100px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 5px;
      }
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
</style>