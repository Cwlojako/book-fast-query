<template>
    <el-drawer v-model="drawerVisible" :show-close="false" class="drawer" @close="onClose">
        <template #header="{ close }">
            <div class="header_wrap">
                <h3>订单列表</h3>
                <el-button type="danger" @click="onClose">
                    <el-icon class="el-icon--left"><CircleCloseFilled /></el-icon>关闭
                </el-button>
            </div>
        </template>
        <el-input
            v-model="keyword"
            clearable
            placeholder="请输入购买人关键字"
            class="search_wrap"
            style="max-width: 300px;"
            @change="(val) => val && getOrderList(val)"
            @clear="getOrderList"
        >
            <template #append>
                <el-button :icon="Search" />
            </template>
        </el-input>
        <el-table 
            border
            stripe
            :data="list"
            style="width: 100%"
        >
            <el-table-column type="index" label="序号" width="80"/>
            <el-table-column prop="uuid" label="订单UUID" width="250" show-overflow-tooltip />
            <el-table-column prop="buyer" label="购买人">
                <template #default="scope">
                    <span class="href" @click="toDetail(scope.row)">{{ scope.row.buyer }}</span>
                    <el-drawer
                        v-model="scope.row.innerDrawerVisible"
                        append-to-body
                        :show-close="false"
                        size="90%"
                        @close="getOrderList"
                    >
                        <template #header="{ close }">
                            <div class="header">
                                <div class="left_area">
                                    <el-tag class="tag" size='large' effect="dark" type="success" round>{{ scope.row.buyer }}</el-tag>
                                    <p>快递数<b style="color: #F56C6C;">{{ totalDeliver }}</b></p>
                                    <p>总金额<b style="color: #F56C6C;">￥{{ totalPrice }}</b></p>
                                    <p>总收益<b style="color: #F56C6C;">￥{{ profit }}</b></p>
                                </div>
                                <div class="right_area">
                                    <el-button type="success" @click="onCart">
                                        <el-icon class="el-icon--left"><ShoppingCart /></el-icon>
                                        加入购物车
                                    </el-button>
                                    <el-button type="primary" @click="onCopy">
                                        <el-icon class="el-icon--left"><CopyDocument /></el-icon>
                                        复制
                                    </el-button>
                                    <el-button type="danger" @click="close">
                                        <el-icon class="el-icon--left"><CircleCloseFilled /></el-icon>
                                        关闭
                                    </el-button>
                                </div>
                            </div>
                        </template>
                        <el-table
                            class="table_wrap"
                            :data="books"
                            style="width: 100%"
                            :row-class-name="drawerTableClassName"
                            :row-style="{
                                maxHeight: '60px'
                            }"
                        >
                            <el-table-column type="index" label="序号" width="80"/>
                            <el-table-column prop="bookName" label="书名" width="150" show-overflow-tooltip/>
                            <el-table-column prop="isbn" label="ISBN编号" />
                            <el-table-column prop="salePrice" label="售价">
                                <template #default="scope">
                                    <span style="margin-right: 10px;">{{ scope.row.salePrice }}</span>
                                    <el-button v-if="scope.row.salePrice" size="small" :icon="ICONTop" type="primary" @click="onAddPrice(scope.row, orderRow)"/>
                                    <el-button v-if="scope.row.salePrice" size="small" :icon="ICONBottom" type="danger" @click="onDecreasePirce(scope.row, orderRow)"/>
                                </template>
                            </el-table-column>
                            <el-table-column prop="quantity" label="数量">
                                <template #default="scope">
                                    <span style="margin-right: 10px;">{{ scope.row.quantity }}</span>
                                    <el-button
                                        v-if="scope.row.salePrice"
                                        type="primary"
                                        size="small"
                                        :icon="ICONPlus"
                                        :disabled="scope.row.quantity === +scope.row.stock"
                                        @click="onAddQuantity(scope.row, orderRow)"
                                    />
                                    <el-button
                                        v-if="scope.row.salePrice"
                                        size="small"
                                        :icon="ICONMinus"
                                        type="danger"
                                        :disabled="scope.row.quantity === 1"
                                        @click="onDecreaseQuantity(scope.row, orderRow)"
                                    />
                                </template>
                            </el-table-column>
                            <el-table-column prop="stock" label="库存" />
                            <el-table-column prop="cover" label="封面" width="120">
                                <template #default="scope">
                                    <el-image
                                        style="width: 50px; height: 50px"
                                        :src="scope.row.cover"
                                        fit="contain"
                                        :preview-src-list="[scope.row.cover]"
                                        preview-teleported/>
                                </template>
                            </el-table-column>
                            <el-table-column prop="platform" label="仓库" width="300" show-overflow-tooltip>
                                <template #default="scope, index">
                                    <span v-if="scope.row.platform !== 'k'">{{ scope.row.platform }}</span>
                                    <span v-else>{{ `${scope.row.platform}【${scope.row.shopName}】` }}</span>
                                </template>
                            </el-table-column>
                            <el-table-column label="操作" fixed="right" width="200">
                                <template #default="scope, index">
                                    <el-button size="small" :icon="ICONDelete" type="danger" @click="onDelBook(scope.$index, orderRow)" />
                                    <el-button size="small" :icon="ICONCopy" type="primary" @click="onCopyItem(scope.row)" />
                                    <el-popover
                                        placement="bottom"
                                        :width="600"
                                        :popper-style="{
                                            height: '500px',
                                            overflowY: 'auto'
                                        }"
                                        trigger="click"
                                        @show="getStock(scope.row, scope.$index)"
                                    >
                                        <template #reference>
                                            <el-button size="small" :icon="ICONRefresh" type="warning"/>
                                        </template>
                                        <el-table :data="stockData" v-loading="loading" class="stock_table" :row-class-name="stockTableClassName">
                                            <el-table-column width="100" prop="price" label="售价">
                                                <template #default="scope">
                                                    <span>{{ scope.row.price || '-' }}</span>
                                                </template>
                                            </el-table-column>
                                            <el-table-column width="100" prop="stock" label="库存">
                                                <template #default="scope">
                                                    <span v-if="scope.row.platform !== 'k'">{{ scope.row.stock }}</span>
                                                    <span v-if="scope.row.platform === 'k' && scope.row.price" :class="{ 'stock_link': !scope.row.isQuery }" @click="onQueryKfzStock(scope.row)">
                                                        {{ scope.row.isQuery ? scope.row.stock : '查看库存'}}
                                                    </span>
                                                </template>
                                            </el-table-column>
                                            <el-table-column prop="platform" label="仓库">
                                                <template #default="scope">
                                                    <span v-if="scope.row.platform !== 'k'">{{ scope.row.platform }}</span>
                                                    <el-tag v-if="scope.row.platform === 'k' && scope.row.price" :type="scope.row.isBought ? 'success' : 'primary'">
                                                        {{ scope.row.shopName }}
                                                    </el-tag>
                                                    <el-tag v-if="scope.row.platform === 'k'" type="danger">
                                                        {{ scope.row.shopAvgShippingTime }}
                                                    </el-tag>
                                                </template>
                                            </el-table-column>
                                            <el-table-column width="100" label="操作" fixed="right">
                                                <template #default="scope">
                                                    <el-button size="small" type="primary" @click="onApply(scope.row)" :disabled="!+scope.row.stock">应用</el-button>
                                                </template>
                                            </el-table-column>
                                        </el-table>
                                    </el-popover>
                                </template>
                            </el-table-column>
                        </el-table>
                    </el-drawer>
                </template>
            </el-table-column>
            <el-table-column prop="deliverCount" label="快递数" />
            <el-table-column prop="price" label="￥总金额" />
            <el-table-column prop="profit" label="￥总利润" />
            <el-table-column label="操作" fixed="right">
                <template #default="scope">
                    <el-popconfirm title="确认删除吗?" @confirm="onDel(scope.row)" >">
                        <template #reference>
                            <el-button :icon="DocumentDelete" type="danger" size="small">删除</el-button>
                        </template>
                    </el-popconfirm>
                </template>
            </el-table-column>
        </el-table>
        <el-row class="page_wrap">
            <el-pagination
                v-model:current-page="pageData.pageNo"
                :page-size="pageData.pageSize"
                :total="pageData.total"
                size="small"
                background
                layout="prev, pager, next"
                @current-change="onPageChange"
            />
        </el-row>
    </el-drawer>
</template>

<script lang="ts" setup>
import axios from 'axios'
import { Search, DocumentDelete, Top, Bottom, Plus, Minus, Delete, CopyDocument, Refresh } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import useClipboard from 'vue-clipboard3'
import * as cheerio from 'cheerio'
const { toClipboard } = useClipboard()
import { debounce } from 'lodash'

interface PageData {
    pageNo: number
    pageSize: number
    total: number
}
const { visible } = defineProps({
    visible: {
        type: Boolean,
        default: false
    }
})
const emits = defineEmits(['update:visible'])

const baseUrl = import.meta.env.VITE_BASE_URL
const drawerVisible = ref(false)
const pageData = reactive<PageData>({
    pageNo: 1,
    pageSize: 10,
    total: 0
})
const list = ref([])
const keyword = ref('')
const books = ref([])
const orderRow = ref({})
const totalPrice = ref(0)
const totalDeliver = ref(0)
const ICONTop = Top
const ICONBottom = Bottom
const ICONPlus = Plus
const ICONMinus = Minus
const ICONDelete = Delete
const ICONCopy = CopyDocument
const ICONRefresh = Refresh
const form = reactive({
	xgToken: localStorage.getItem('xgToken') || '',
	xcToken: localStorage.getItem('xcToken') || '',
	jsyToken: localStorage.getItem('jsyToken') || '',
	ylCookie: localStorage.getItem('ylCookie') || '',
	kfzCookie: localStorage.getItem('kfzCookie') || ''
})
const loading = ref(false)
const stockData = ref([])
const currIsbn = ref('')
const bookIndex = ref(-1)

watch(() => visible, (val) => {
    drawerVisible.value = val
    val && getOrderList()
})

const profit = computed(() => {
	let totalOriginPrice = books.value.reduce((curr, next) => {
		return curr + (next.price ? next.price * next.quantity : 0)
	}, 0)
	let kfz = books.value.filter(f => f.platform === 'k')
	if (kfz.length) {
		const kfzTotal = kfz.reduce((curr, next) => {
			return curr + (next.price ? next.price * next.quantity : 0)
		}, 0)
		totalOriginPrice += Number((kfzTotal * 0.006).toFixed(2))
	}

	const totalSalePrice = books.value.reduce((curr, next) => {
		return curr + (next.salePrice ? next.salePrice * next.quantity : 0)
	}, 0)

	const profit = (totalSalePrice - totalOriginPrice).toFixed(2)
	return profit
})

function onClose() {
    emits('update:visible', false)
}

function toDetail(row) {
    orderRow.value = row
    books.value = row.list
    calcTotalPrice()
    calcTotalDeliver()
    row.innerDrawerVisible = true
}

function onPageChange(val) {
    pageData.pageNo = val
    getOrderList()
}

async function getOrderList(keyword = '') {
    const { data: res } = await axios.get(`${baseUrl}/orderList?pageSize=${pageData.pageSize}&pageNo=${pageData.pageNo}&buyer=${keyword}`)
    list.value = res.data
}

async function onDel(row) {
    await axios.delete(`${baseUrl}/order/${row.uuid}`)
    ElMessage.success('删除成功')
    getOrderList()
}

// 计算总价
function calcTotalPrice() {
	totalPrice.value = books.value.filter(f => f.stock).reduce((curr, next) => {
		return curr + (next.salePrice ? next.salePrice * next.quantity : 0)
	}, 0)

}

// 计算总包裹数
function calcTotalDeliver() {
	const arr = books.value.filter(f => f.stock).map(m => {
		return m.platform !== 'k' ? m.platform : `${m.platform}${m.shopId}`
	})
	totalDeliver.value = new Set(arr).size
}

async function onCopyItem(row) {
	let str = `${row.bookName}\t${row.isbn}\t${row.salePrice ? `￥${row.salePrice}` : '暂缺'}`
	await toClipboard(str)
	ElMessage({
		type: "success",
		message: "复制成功"
	})
}

// 复制
async function onCopy() {
	let targetData = books.value.map(m => {
		return {
			bookName: m.bookName.replaceAll('\n', ''),
			isbn: m.platform === 'k' && m.qualityText === '全新' ? `${m.isbn}【全新】` : m.isbn,
			salePrice: m.salePrice ? `￥${m.salePrice}` : '-',
			quantity: m.quantity ? m.quantity : '-',
			totalPrice: m.salePrice ? `￥${m.salePrice * m.quantity}` : '-',
			stock: m.stock || '-',
			platform: m.stock ? m.platform === 'k' ? `${m.platform}【${m.shopName}】` : m.platform : '-'
		}
	})
	let str = `书名\tISBN编号\t单本售价\t数量\t价格\t库存\t仓库\n`
	targetData.forEach(e => {
		Object.keys(e).forEach(h => {
			str += e[h] + '\t'
		})
		str += '\n'
	})
	str = `${str}\n总价：￥${totalPrice.value}\t${totalDeliver.value}个快递`
	await toClipboard(str)
	ElMessage({
		type: "success",
		message: "复制成功",
	})
}

// 小谷加入购物车
function xgyAddCart() {
	return new Promise(async (resolve, reject) => {
		if (!books.value.some(s => s.platform === 'x')) {
			resolve(true)
			return
		}
		let x = books.value.filter(f => f.platform === 'x')
		let promiseArr = x.map(m => {
			return axios.get(`${baseUrl}/xiaoguya/addCart?specId=${m.specId}&token=${form.xgToken}&count=${m.quantity}&isbn=${m.isbn}`)
		})
		const res = await Promise.all(promiseArr)
		if (res.every(e => e.data.success)) {
			resolve(true)
		} else {
			if (res.some(s => s.data.code === 401)) {
				ElMessage.error('小谷Token已过期，请更新Token')
			} else if (res.some(s => s.data.code === 400)) {
				let isbnArr = res.filter(f => f.data.code === 400).map(m => m.data.data.isbn)
				let str = x.filter(f => isbnArr.includes(f.isbn)).map(m => m.bookName).join(',')
				ElMessage.error(`【${str}】商品限购4个`)
			}
			resolve(false)
		}
	})
}

// 星辰加入购物车
function xcAddCart() {
	return new Promise(async (resolve, reject) => {
		if (!books.value.some(s => s.platform === 'xc')) {
			resolve(true)
			return
		}
		let xc = books.value.filter(f => f.platform === 'xc')
		let promiseArr = xc.map(m => {
			const { bookId, conditionId, specificationId } = m.specItem
			return axios.get(`${baseUrl}/xc/addCart?itemId=${bookId}&token=${form.xcToken}&num=${m.quantity}&conditionId=${conditionId}&specificationId=${specificationId}`)
		})
		const res = await Promise.all(promiseArr)
		if (res.every(e => e.data.status === 200)) {
			resolve(true)
		} else {
			if (res.some(s => s.data.code === 401)) {
				ElMessage.error('请设置星辰Token')
			}
			resolve(false)
		}
	})
}

// 孔夫子加入购物车
function kfzAddCart() {
	return new Promise(async (resolve, reject) => {
		if (!books.value.some(s => s.platform === 'k')) {
			resolve(true)
			return
		}
		let k = books.value.filter(f => f.platform === 'k')
		let promiseArr = k.map(m => {
			const { shopId, itemId, quantity } = m
			return axios.get(`${baseUrl}/kfz/addCart?itemId=${itemId}&shopId=${shopId}&numbers=${quantity}&cookie=${form.kfzCookie}`)
		})
		const res = await Promise.all(promiseArr)
		if (res.every(e => e.data.status === 1)) {
			resolve(true)
		} else {
			resolve(false)
		}
	})
}

// 有路网加入购物车
function ylAddCart() {
	return new Promise(async (resolve, reject) => {
		if (!books.value.some(s => s.platform === 'y')) {
			resolve(true)
			return
		}
		let y = books.value.filter(f => f.platform === 'y')
		let promiseArr = y.map(m => {
			const { bookId, quantity } = m
			return axios.get(`${baseUrl}/youlu/addCart?bookId=${bookId}&buyCount=${quantity}&cookie=${form.ylCookie}`)
		})
		const res = await Promise.all(promiseArr)
		if (res.every(e => e.data)) {
			resolve(true)
		} else {
			resolve(false)
		}
	})
}

// 旧书云加入购物车
function jsyAddCart() {
	return new Promise(async (resolve, reject) => {
		if (!books.value.some(s => s.platform === 'jsy')) {
			resolve(true)
			return
		}
		let jsy = books.value.filter(f => f.platform === 'jsy')
		let promiseArr = jsy.map(m => {
			const { bookId, quantity } = m
			return axios.get(`${baseUrl}/jsy/addCart?bookId=${bookId}&quantity=${quantity}&token=${form.jsyToken}`)
		})
		const res = await Promise.all(promiseArr)
		if (res.every(e => e.data.status_code === 200)) {
			resolve(true)
		} else {
			resolve(false)
		}
	})
}

// 加入购物车
async function onCart() {
	const res = await Promise.all([xgyAddCart(), xcAddCart(), kfzAddCart(), ylAddCart(), jsyAddCart()])
	if (res.every(e => Boolean(e))) {
		ElMessage.success('加入购物车成功')
	} else {
		!res[0] && ElMessage.error('小谷吖加入购物车失败')
		!res[1] && ElMessage.error('星辰加入购物车失败')
		!res[2] && ElMessage.error('孔夫子网加入购物车失败')
		!res[3] && ElMessage.error('有路网加入购物车失败')
		!res[4] && ElMessage.error('旧书云加入购物车失败')
	}
}

function onAddPrice(row, orderRow) {
	row.salePrice += 1
    calcTotalPrice()
    debouncedUpdateOrder(orderRow)
}

function onDecreasePirce(row, orderRow) {
    row.salePrice -= 1
    calcTotalPrice()
    debouncedUpdateOrder(orderRow)
}

function onAddQuantity(row, orderRow) {
    row.quantity += 1
    calcTotalPrice()
    debouncedUpdateOrder(orderRow)
}

function onDecreaseQuantity(row, orderRow) {
    row.quantity -= 1
    calcTotalPrice()
    debouncedUpdateOrder(orderRow)
}

function onDelBook(index, orderRow) {
	books.value.splice(index, 1)
	calcTotalPrice()
	calcTotalDeliver()
    debouncedUpdateOrder(orderRow)
}

const debouncedUpdateOrder = debounce(async (row) => {
    let params = initParams(row)
    console.log('======', params)
    await axios.put(`${baseUrl}/order/${row.uuid}`, params)
    ElMessage.success('更新成功')
}, 500, { leading: true })

function initParams(row) {
	return {
		buyer: row.buyer,
		price: totalPrice.value,
		deliverCount: totalDeliver.value,
		profit: profit.value,
		list: books.value
	}
}

const drawerTableClassName = ({ row }) => {
	if (+row.stock <= 3) {
		return 'warning-row'
	}
}

const stockTableClassName = ({ row }) => {
    return row.price ? '' : 'danger-row'
}

// 有路搜索
async function ylSearch(isbn) {
	let obj = { isbn, platform: 'y' }
	const { data: html } = await axios.get(`${baseUrl}/youlu?isbn=${isbn}`)
	const $ = await cheerio.load(html)
	if ($('.bookname').length) {
		let arr = $('.bookname').map(async (m, el) => {
			const bookId = $(el).children().first().attr('href').slice(1)
			obj.originPrice = $(el).next().children().first().children().last().text().slice(1)
			// 获取价格
			const { data: priceDetail } = await axios.get(`${baseUrl}/youlu/detail?bookId=${bookId}`)
			obj.price = priceDetail.info ? JSON.parse(priceDetail.info).main.SalePriceVip : ''
			obj.stock = priceDetail.info ? JSON.parse(priceDetail.info).main.StoreCounts : ''
			return {
				...obj,
				bookName: $(el).text(),
				cover: $('.book_face').children().first().children().first().attr('src'),
				bookId
			}
		}).get()
		const data = await Promise.all(arr)
		return data
	} else {
		obj.bookName = ''
		obj.price = ''
		obj.stock = ''
		return [obj]
	}
}

// 小谷吖搜索
async function xgySearch(isbn) {
	let obj = { isbn, platform: 'x' }
	const { data: res } = await axios.get(`${baseUrl}/xiaoguya?isbn=${isbn}&token=${form.xgToken}`)
	if (res.code === 401) {
		ElMessage.error(res.message)
		return 
	}
	if (res.data.products) {
		const p = res.data.products
		obj.bookName = p[0].name
		obj.cover = p[0].image
		obj.originPrice = p[0].price
		const bookId = p[0].id
		const { data: priceDetail } = await axios.get(`${baseUrl}/xiaoguya/detail?bookId=${bookId}&token=${form.xgToken}`)
		let specs = priceDetail.data.specs.sort((a, b) => a.price - b.price)
		let hasStockItem = specs.find(f => f.stock > 0)
		obj.price = hasStockItem ? hasStockItem.price : ''
		obj.stock = hasStockItem ? hasStockItem.stock : ''
		obj.specId = hasStockItem ? hasStockItem.id : ''
	} else {
		obj.bookName = ''
		obj.price = ''
		obj.stock = ''
	}
	return [obj]
}

// 星辰搜索
async function xcSearch(isbn) {
	let obj = { isbn, platform: 'xc' }
	const { data: res } = await axios.get(`https://book.xclink.cn/xc-app/linkitembook/searchList?pageNum=0&pageSize=10&condition=${isbn}&typeId=&typeId2=&isStock=0&isPriceSort=0`)
	if (res.data && res.data.total && res.data.list[0].isbn === isbn) {
		const l = res.data.list[0]
		obj.bookName = l.title
		obj.cover = l.image
		const bookId = l.itemId
		const { data: priceDetail } = await axios.get(`${baseUrl}/xc/detail?bookId=${bookId}`)
		let specs = priceDetail.data.sort((a, b) => a.nowPrice - b.nowPrice)
		let hasStockItem = specs.find(f => f.inventory > 0)
		obj.price = hasStockItem ? hasStockItem.nowPrice : ''
		obj.stock = hasStockItem ? hasStockItem.inventory : ''
		obj.originPrice = hasStockItem ? hasStockItem.integralPrice : ''
		obj.specItem = hasStockItem
	} else {
		obj.bookName = ''
		obj.price = ''
		obj.stock = ''
	}
	return [obj]
}

// 旧书云搜索
async function jsySearch(isbn, isBatch = false) {
	let obj = { isbn, platform: 'jsy' }
	const { data: res } = await axios.get(`${baseUrl}/jsy?isbn=${isbn}`)
	if (res.status_code === 200 && res.data.data.length) {
		const l = res.data.data[0]
		obj.bookName = l.title
		obj.cover = l.image
		obj.price = l.price
		obj.originPrice = l.original_price
		obj.stock = l.stock
		obj.bookId = l.id
	} else {
		obj.bookName = ''
		obj.price = ''
		obj.stock = ''
	}
	return [obj]
}

// 孔夫子搜索
async function kfzSearch(isbn) {
	let obj = { isbn, platform: 'k' }
	const { data: res } = await axios.get(`${baseUrl}/kfz?isbn=${isbn}&cookie=${form.kfzCookie}`)
	if (res.data.requestRejectAction === 'GO_LOGIN') {
		ElMessage.error('孔夫子网未登录,请重试')
		return
	}
	if (res.data.itemResponse.total > 0) {
		const l = res.data.itemResponse.list
		let arr = l.map(m => {
			return {
				...obj,
				...m,
				bookName: m.title,
				price: getKfzPrice(m),
				cover: m.imgBigUrl,
				isBought: m.isUserBoughtShop,
				isQuery: false
			}
		})
        return arr
	} else {
		obj.bookName = ''
		obj.price = ''
		obj.stock = ''
		return [obj]
	}
}

// 获取孔夫子价格
function getKfzPrice(m) {
	let shippingPrice = 0
	if (m.postage.shippingList.length) {
		const s = m.postage.shippingList[0]
		const { freeShippingFee, shippingFee } = s
		shippingPrice = (freeShippingFee && m.price > freeShippingFee) ? 0 : shippingFee
		return (m.price + shippingPrice).toFixed(2)
	} else {
		return m.price
	}
}

// 查询孔夫子库存
function onQueryKfzStock(row) {
	return new Promise(async (resolve, reject) => {
		const { shopId, itemId } = row
		const { data: html } = await axios.get(`${baseUrl}/kfz/detail?shopId=${shopId}&itemId=${itemId}&cookie=${form.kfzCookie}`)
		row.isQuery = true
		const $ = await cheerio.load(html)
		if ($('.count-val').length) {
			row.stock = $('.store-count').text()
		} else {
			row.stock = 1
		}
		resolve(row.stock)
	})
}

async function getStock(row, index) {
    bookIndex.value = index
    if (currIsbn.value === row.isbn) return
    currIsbn.value = row.isbn
    loading.value = true
    const searchArr = [ylSearch(row.isbn), xcSearch(row.isbn), xgySearch(row.isbn), jsySearch(row.isbn)]
    let data = await Promise.all(await Promise.all(searchArr))
    let kfzData = await kfzSearch(row.isbn)
    stockData.value = data.flat().concat(kfzData)
    loading.value = false
}

function onApply(row) {
    row.salePrice = Math.ceil(+row.price + 5)
    row.quantity = 1
    books.value.splice(bookIndex.value, 1, row)
    calcTotalPrice()
    calcTotalDeliver()
    debouncedUpdateOrder(orderRow.value)
}

</script>

<style lang="scss" scoped>
.header_wrap {
    display: flex;
    justify-content: space-between;
    align-items: center;
}
.header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    .left_area {
        display: flex;
        align-items: center;
        p {
            margin-right: 20px;
        }
        .tag {
            margin-right: 10px;
            font-size: 16px;
            font-weight: bold;
        }
    }
}
.page_wrap {
    display: flex;
    justify-content: flex-end;
    margin-top: 20px;
}
.href {
    color: #1890ff;
    cursor: pointer;
}
.search_wrap {
    margin-bottom: 20px;
}
.table_wrap {
    padding: 10px 32px;
    ::v-deep(.warning-row) {
        background-color: #fdf6ec;
    }
}
.stock_table {
    ::v-deep(.danger-row) {
        background-color: #f9e1e1;
    }
    .stock_link {
        cursor: pointer;
        color: #409EFF;
    }
}
.stock_popover {
    height: 500px;
    overflow-y: auto;
}
</style>