<template>
	<el-card class="card">
		<el-row class="search_wrap" gutter="20">
			<el-col :xs="24" :sm="9">
				<el-input
					v-model="isbn"
					clearable
					style="width: 100%;"
					placeholder="请输入isbn编号,多个时用.分割开"
					@clear="onClear"
					@keyup.enter="onSearch(true)"
				/>
				<div class="tags">
					<el-tag type="primary" @click="isbn = '9787040610536'">习概</el-tag>
					<el-tag type="success" @click="isbn = '9787040599039'">毛概</el-tag>
					<el-tag type="info" @click="isbn = '9787040599015'">近代史纲要</el-tag>
					<el-tag type="warning" @click="isbn = '9787040599008'">马原</el-tag>
					<el-tag type="danger" @click="isbn = '9787040599022'">思法</el-tag>
					<el-tag type="primary" @click="isbn = '9787040617405'">国安读本</el-tag>
					<el-tag type="success" @click="isbn = '9787040589818'">高数八上册</el-tag>
					<el-tag type="info" @click="isbn = '9787040588682'">高数八下册</el-tag>
				</div>
			</el-col>
			<el-col :xs="24" :sm="3">
				<el-button type="info" @click="onSearch" style="width: 100%;" >查&nbsp;询</el-button>
			</el-col>
			<el-col :xs="24" :sm="3">
				<el-button type="success" @click="onSetXgToken" style="width: 100%;">设置小谷Token</el-button>
			</el-col>
			<el-col :xs="24" :sm="3">
				<el-button type="danger" @click="onSetKfzCookie" style="width: 100%;">设置孔夫子Cookie</el-button>
			</el-col>
			<el-col :xs="24" :sm="3">
				<el-button type="primary" @click="onSetXcToken" style="width: 100%;">设置星辰Token</el-button>
			</el-col>
			<el-col :xs="24" :sm="3">
				<el-button type="warning" @click="onSetYlCookie" style="width: 100%;">设置有路Cookie</el-button>
			</el-col>
		</el-row>
		<el-row class="table_wrap">
			<el-table
				:data="tableData"
				:row-class-name="rowClassName"
				style="width: 100%"
				border
				@select="onSelectClick"
				ref="table"
			>
				<el-table-column type="selection" width="55" />
				<el-table-column prop="bookName" label="书名" />
				<el-table-column prop="isbn" label="ISBN编号" />
				<el-table-column prop="price" label="价格">
					<template #default="scope">
						<div class="price_box">
							<span v-if="scope.row.platform !== 'k'">{{ scope.row.price }}</span>
							<span v-else>
								{{ scope.row.price }}
								<el-tag type="success">
									{{ scope.row.qualityText }}
								</el-tag>
							</span>
						</div>
					</template>
				</el-table-column>
				<el-table-column prop="originPrice" label="原价" />
				<el-table-column prop="stock" label="库存">
					<template #default="scope">
						<span v-if="scope.row.platform !== 'k'">{{ scope.row.stock }}</span>
						<span v-if="scope.row.platform === 'k' && scope.row.price" :class="{ 'stock_link': !scope.row.isQuery }" @click="onQueryKfzStock(scope.row)">
							{{ scope.row.isQuery ? scope.row.stock : '查看库存'}}
						</span>
					</template>
				</el-table-column>
				<el-table-column prop="cover" label="封面">
					<template #default="scope">
						<el-image
							style="width: 80px; height: 80px"
							:src="scope.row.cover"
							fit="contain"
							:preview-src-list="[scope.row.cover]"
							preview-teleported/>
					</template>
				</el-table-column>
				<el-table-column prop="platform" label="平台">
					<template #default="scope">
						<p>{{ platformComp(scope.row.platform) }}</p>
						<el-tag v-if="scope.row.platform === 'k' && scope.row.price" :type="scope.row.isBought ? 'success' : 'primary'">
							{{ scope.row.shopName }}
						</el-tag>
						<el-tag v-if="scope.row.platform === 'k'" type="danger">
							{{ scope.row.shopAvgShippingTime }}
						</el-tag>
					</template>
				</el-table-column>
			</el-table>

			<el-badge class="selected_box" :value="selected.length" :offset="[-10, 0]" @click="onShowDrawer">
				<el-icon size="24"><Document /></el-icon>
			</el-badge>

			<el-drawer v-model="drawerVisible" :show-close="false" @open="onDrawerOpen">
				<template #header="{ close, titleClass }">
					<h4 :class="titleClass">订单号：{{ orderNoComp }}</h4>
					<div>
						<el-button type="success" @click="onCart">
							<el-icon class="el-icon--left"><ShoppingCart /></el-icon>
							加入购物车
						</el-button>
						<el-button type="primary" @click="onCopy">
							<el-icon class="el-icon--left"><CopyDocument /></el-icon>
							复制
						</el-button>
						<el-button type="warning" @click="onReset">
							<el-icon class="el-icon--left"><DeleteFilled /></el-icon>
							清空
						</el-button>
						<el-button type="danger" @click="close">
							<el-icon class="el-icon--left"><CircleCloseFilled /></el-icon>
							关闭
						</el-button>
					</div>
				</template>
				<el-table 
					:data="selected"
					style="width: 100%"
					:row-class-name="drawerTableClassName" 
					:row-style="{
						maxHeight: '60px'
					}"
				>
					<el-table-column type="index" label="序号" width="80"/>
					<el-table-column prop="bookName" label="书名" />
					<el-table-column prop="isbn" label="ISBN编号" />
					<el-table-column prop="salePrice" label="售价">
						<template #default="scope">
							<span style="margin-right: 10px;">{{ scope.row.salePrice }}</span>
							<el-button v-if="scope.row.salePrice" size="small" :icon="ICONTop" type="primary" @click="scope.row.salePrice += 1, calcTotalPrice()"/>
							<el-button v-if="scope.row.salePrice" size="small" :icon="ICONBottom" type="danger" @click="scope.row.salePrice -= 1, calcTotalPrice()"/>
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
								@click="scope.row.quantity += 1, calcTotalPrice()"
							/>
							<el-button
								v-if="scope.row.salePrice"
								size="small"
								:icon="ICONMinus"
								type="danger"
								:disabled="scope.row.quantity === 1"
								@click="scope.row.quantity -= 1, calcTotalPrice()"
							/>
						</template>
					</el-table-column>
					<el-table-column prop="stock" label="库存" />
					<el-table-column prop="cover" label="封面">
						<template #default="scope">
							<el-image
								style="width: 50px; height: 50px"
								:src="scope.row.cover"
								fit="contain"
								:preview-src-list="[scope.row.cover]"
								preview-teleported/>
						</template>
					</el-table-column>
					<el-table-column prop="platform" label="平台">
						<template #default="scope, index">
							<span v-if="scope.row.platform !== 'k'">{{ scope.row.platform }}</span>
							<span v-else>{{ `${scope.row.platform}【${scope.row.shopName}】` }}</span>
						</template>
					</el-table-column>
					<el-table-column label="操作">
						<template #default="scope, index">
							<el-button size="small" :icon="ICONDelete" type="warning" @click="onDel(scope.$index)" />
							<el-button size="small" :icon="ICONCopy" type="primary" @click="onCopyItem(scope.row)" />
						</template>
					</el-table-column>
				</el-table>
				<el-row>
					<p>总金额<b style="color: #F56C6C;">￥{{ totalPrice }}</b></p>
					<p style="margin-left: 50px;"><b style="color: #F56C6C;">{{ totalDeliver }}</b>个快递</p>
				</el-row>
			</el-drawer>
		</el-row>
	</el-card>
</template>

<script lang="ts" setup>
import { ElMessage, ElMessageBox } from 'element-plus'
import { Top, Bottom, Delete, Plus, Minus, CopyDocument } from '@element-plus/icons-vue'
import axios from 'axios'
import * as cheerio from 'cheerio'
import { cloneDeep } from 'lodash'
import useClipboard from 'vue-clipboard3'
import { onMounted } from 'vue'
const { toClipboard } = useClipboard()

const baseUrl = import.meta.env.VITE_BASE_URL
const table = ref()
const isbn = ref('')
const tableData = ref([])
const token = ref(localStorage.getItem('xgToken') || '')
const cookie = ref(localStorage.getItem('kfzCookie') || '')
const xcToken = ref(localStorage.getItem('xcToken') || '')
const ylCookie = ref(localStorage.getItem('xcToken') || '')
const selected = ref([])
const drawerVisible = ref(false)
const totalPrice = ref(0)
const totalDeliver = ref(0)
const ICONTop = Top
const ICONBottom = Bottom
const ICONDelete = Delete
const ICONPlus = Plus
const ICONMinus = Minus
const ICONCopy = CopyDocument

const platformComp = computed(() => {
	return (platform) => {
		switch (platform) {
			case 'y':
				return '有路网'
			case 'x':
				return '小谷吖'
			case 'k':
				return '孔夫子'
			case 'xc':
				return '星辰'
		}
	}
})

const orderNoComp = computed(() => {
	const date = new Date()
	const year = date.getFullYear()
	const month = date.getMonth() + 1 < 10 ? `0${date.getMonth() + 1}` : date.getMonth() + 1
	const day = date.getDate() < 10 ? `0${date.getDate()}` : date.getDate()

	const totalOriginPrice = selected.value.reduce((curr, next) => {
		return curr + (next.price ? next.price * next.quantity : 0)
	}, 0)

	const totalSalePrice = selected.value.reduce((curr, next) => {
		return curr + (next.salePrice ? next.salePrice * next.quantity : 0)
	}, 0)

	const profit = (totalSalePrice - totalOriginPrice).toFixed(2)

	return `${year}${month}${day}-${profit}-${getRandom()}`
})

const rowClassName = ({ row }) => {
	switch (row.platform) {
		case 'y':
			return 'danger-row'
		case 'x':
			return 'success-row'
		case 'k':
			return 'warning-row'
		case 'xc':
			return 'primary-row'
	}
}

const drawerTableClassName = ({ row }) => {
	if (isNaN(+row.stock) && row.platform !== 'k') {
		return 'danger-row'
	} else if (+row.stock <= 3 && row.platform !== 'k') {
		return 'warning-row'
	}
}

function getRandom() {
	let random = Math.floor(Math.random() * 10000) + 1
	const length = String(random).length
	if (length < 5) {
		for(let i = length; i < 5; i++) {
			random = '0' + random
		}
		return random
	} else {
		return random
	}
}

// 有路搜索
async function ylSearch(isbn, isBatch = false) {
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
		if (isBatch) {
			return data
		}
		tableData.value = tableData.value.concat(data)
	} else {
		obj.bookName = ''
		obj.price = ''
		obj.stock = ''
		if (isBatch) {
			return [obj]
		}
		tableData.value.push(obj)
	}
}

// 小谷吖搜索
async function xgySearch(isbn, isBatch = false) {
	let obj = { isbn, platform: 'x' }
	token.value = localStorage.getItem('xgToken')
	const { data: res } = await axios.get(`${baseUrl}/xiaoguya?isbn=${isbn}&token=${token.value}`)
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
		const { data: priceDetail } = await axios.get(`${baseUrl}/xiaoguya/detail?bookId=${bookId}&token=${token.value}`)
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
	if (isBatch) {
		return [obj]
	}
	tableData.value.push(obj)
}

// 星辰搜索
async function xcSearch(isbn, isBatch = false) {
	let obj = { isbn, platform: 'xc' }
	const { data: res } = await axios.get(`${baseUrl}/xc?isbn=${isbn}`)
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
	if (isBatch) {
		return [obj]
	}
	tableData.value.push(obj)
}

// 孔夫子搜索
async function kfzSearch(isbn, isBatch = false) {
	let obj = { isbn, platform: 'k' }
	cookie.value = localStorage.getItem('kfzCookie')
	const { data: res } = await axios.get(`${baseUrl}/kfz?isbn=${isbn}&cookie=${cookie.value}`)
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
		if (isBatch) {
			return arr
		}
		tableData.value = tableData.value.concat(arr)
	} else {
		obj.bookName = ''
		obj.price = ''
		obj.stock = ''
		if (isBatch) {
			return [obj]
		}
		tableData.value.push(obj)
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
		cookie.value = localStorage.getItem('kfzCookie')
		const { data: html } = await axios.get(`${baseUrl}/kfz/detail?shopId=${shopId}&itemId=${itemId}&cookie=${cookie.value}`)
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

// 总搜索
async function onSearch(isReset = false) {
	isReset && (tableData.value = [])
	if (isbn.value.split('.').length > 1) {
		let isbns = [...new Set(isbn.value.split('.'))]
		console.log(isbns)
		isbns.forEach(async e => {
			let res = await Promise.all([ylSearch(e, true), xgySearch(e, true), xcSearch(e, true), kfzSearch(e, true)])
			/*** 规则
			 * 1、有小谷优先小谷
			 * 2、没有小谷的话取星辰或有路网价格最低的
			 * 3、再没有的话取孔夫子网的，需满足发货时长小于28小时的且价格最低的
			 * 4、都没有的话随机取第一个
			 */
			const [res1, res2, res3, res4] = res
			const totalRes = res.reduce((curr, next) => {
				return curr.concat(...next)
			}, [])
			const xg = totalRes.find(f => f.platform === 'x' && f.price)
			const min = totalRes.filter(f => f.price && !['k', 'x'].includes(f.platform)).sort((a, b) => a.price - b.price)[0]
			const kfz = res4.filter(f => f.shopAvgShippingTime && +f.shopAvgShippingTime.match(/\d+/g) && +f.shopAvgShippingTime.match(/\d+/g)[0] < 24).sort((a, b) => (a.price - b.price))[0]
			if (xg) {
				selected.value.push(xg)
			} else {
				if (min) {
					selected.value.push(min)
				} else {
					kfz ? selected.value.push(kfz) : selected.value.push(res1[0])
				}
			}
			selected.value.filter(f => !f.isCalc).forEach(e => {
				if (e.price && +e.price < 4) {
					e.salePrice = 10
					e.isCalc = true
					e.quantity = 1
				} else if (e.price && +e.price >= 4) {
					e.salePrice = Math.ceil(+e.price + 5)
					e.isCalc = true
					e.quantity = 1
				} else {
					e.quantity = ''
				}
			})
		})
	} else {
		await Promise.all([xgySearch(isbn.value), xcSearch(isbn.value), ylSearch(isbn.value)])
		// 孔夫子
		kfzSearch(isbn.value)
	}
	
}

// 重置小谷token
function onSetXgToken() {
	ElMessageBox.prompt('请输入新的Token', '提示', {
		confirmButtonText: 'OK',
		cancelButtonText: 'Cancel'
	})
	.then(({ value }) => {
		localStorage.setItem('xgToken', value)
	})
	.catch(() => {})
}

// 重置孔夫子cookie
function onSetKfzCookie() {
	ElMessageBox.prompt('请输入新的Cookie', '提示', {
		confirmButtonText: 'OK',
		cancelButtonText: '重新获取',
		inputPlaceholder: 'PHPSESSID'
	})
	.then(({ value }) => {
		localStorage.setItem('kfzCookie', value)
	})
	.catch(async () => {
		let { data: res } = await axios.get(`${baseUrl}/kfz/getCookie`)
		ElMessage.success(res)
	})
}

// 设置星辰Token
function onSetXcToken() {
	ElMessageBox.prompt('请输入Token', '提示', {
		confirmButtonText: 'OK',
		cancelButtonText: 'Cancel'
	})
	.then(({ value }) => {
		localStorage.setItem('xcToken', value)
	})
	.catch(() => {})
}

// 设置有路Cookie
function onSetYlCookie() {
	ElMessageBox.prompt('请输入新的Cookie', '提示', {
		confirmButtonText: 'OK',
		cancelButtonText: 'Cancel',
		inputPlaceholder: 'CokVisitorId'
	})
	.then(({ value }) => {
		localStorage.setItem('ylCookie', value)
	})
	.catch(() => {})
}

// 搜索文本清空
function onClear() {
	tableData.value = []
}

// 选中
function onSelectClick(selection, row) {
	if (!selection.length) {
		selected.value.pop()
		return
	}
	if (selection.length > 1) {
		const del_row = selection.shift()
		table.value.toggleRowSelection(del_row, false)
	}
	const target = selection[0]
	const idx = selected.value.findIndex(f => f.isbn === target.isbn)
	if (idx > -1) {
		selected.value[idx] = cloneDeep(selection[0])
	} else {
		selected.value = cloneDeep(selected.value.concat(selection))
	}
	selected.value.filter(f => !f.isCalc).forEach(e => {
		if (e.price && +e.price < 4) {
			e.salePrice = 10
			e.isCalc = true
			e.quantity = 1
		} else if (e.price && +e.price >= 4) {
			e.salePrice = Math.ceil(+e.price + 5)
			e.isCalc = true
			e.quantity = 1
		} else {
			e.quantity = ''
		}
	})
}

// 显示抽屉
function onShowDrawer() {
	drawerVisible.value = true
}

// 计算总价
function calcTotalPrice() {
	totalPrice.value = selected.value.filter(f => f.stock).reduce((curr, next) => {
		return curr + (next.salePrice ? next.salePrice * next.quantity : 0)
	}, 0)
}

// 计算总包裹数
function calcTotalDeliver() {
	const arr = selected.value.filter(f => f.stock).map(m => {
		return m.platform !== 'k' ? m.platform : `${m.platform}${m.shopId}`
	})
	totalDeliver.value = new Set(arr).size
}

// 打开抽屉时
async function onDrawerOpen() {
	await Promise.all(selected.value.filter(f => f.platform === 'k' && f.price && !f.isQuery).map(m => onQueryKfzStock(m)))
	calcTotalPrice()
	calcTotalDeliver()
}

// 删除
function onDel(index) {
	selected.value.splice(index, 1)
	calcTotalPrice()
	calcTotalDeliver()
}

async function onCopyItem(row) {
	let str = `${row.bookName}\t${row.isbn}\t${row.salePrice ? `￥${row.salePrice}` : '暂缺'}`
	await toClipboard(str)
	ElMessage({
		type: "success",
		message: "复制成功"
	})
}

// 清空
function onReset() {
	selected.value = []
	calcTotalPrice()
	calcTotalDeliver()
}

// 复制
async function onCopy() {
	let targetData = selected.value.map(m => {
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
	let str = `订单号【${orderNoComp.value}】\n书名\tISBN编号\t单本售价\t数量\t价格\t库存\t平台\n`
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
		if (!selected.value.some(s => s.platform === 'x')) {
			resolve(true)
			return
		}
		token.value = localStorage.getItem('xgToken')
		let x = selected.value.filter(f => f.platform === 'x')
		let promiseArr = x.map(m => {
			return axios.get(`${baseUrl}/xiaoguya/addCart?specId=${m.specId}&token=${token.value}&count=${m.quantity}&isbn=${m.isbn}`)
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
		if (!selected.value.some(s => s.platform === 'xc')) {
			resolve(true)
			return
		}
		xcToken.value = localStorage.getItem('xcToken')
		let xc = selected.value.filter(f => f.platform === 'xc')
		let promiseArr = xc.map(m => {
			const { bookId, conditionId, specificationId } = m.specItem
			return axios.get(`${baseUrl}/xc/addCart?itemId=${bookId}&token=${xcToken.value}&num=${m.quantity}&conditionId=${conditionId}&specificationId=${specificationId}`)
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
		if (!selected.value.some(s => s.platform === 'k')) {
			resolve(true)
			return
		}
		cookie.value = localStorage.getItem('kfzCookie')
		let k = selected.value.filter(f => f.platform === 'k')
		let promiseArr = k.map(m => {
			const { shopId, itemId, quantity } = m
			return axios.get(`${baseUrl}/kfz/addCart?itemId=${itemId}&shopId=${shopId}&numbers=${quantity}&cookie=${cookie.value}`)
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
		if (!selected.value.some(s => s.platform === 'y')) {
			resolve(true)
			return
		}
		ylCookie.value = localStorage.getItem('ylCookie')
		let y = selected.value.filter(f => f.platform === 'y')
		let promiseArr = y.map(m => {
			const { bookId, quantity } = m
			return axios.get(`${baseUrl}/youlu/addCart?bookId=${bookId}&buyCount=${quantity}&cookie=${ylCookie.value}`)
		})
		const res = await Promise.all(promiseArr)
		if (res.every(e => e.data)) {
			resolve(true)
		} else {
			resolve(false)
		}
	})
}

// 加入购物车
async function onCart() {
	const res = await Promise.all([xgyAddCart(), xcAddCart(), kfzAddCart(), ylAddCart()])
	if (res.every(e => Boolean(e))) {
		ElMessage.success('加入购物车成功')
	} else {
		!res[0] && ElMessage.error('小谷吖加入购物车失败')
		!res[1] && ElMessage.error('星辰加入购物车失败')
		!res[2] && ElMessage.error('孔夫子网加入购物车失败')
		!res[3] && ElMessage.error('有路网加入购物车失败')
	}
}
</script>

<style lang="scss" scoped>
	.card {
		::v-deep(.el-card__body) {
			padding: 0;
		}
	}
	.search_wrap {
		padding: 10px 32px 10px 32px;
		.el-input {
			margin-top: 10px;
		}
		.el-button {
			margin-top: 10px;
		}
		.tags {
			margin-top: 10px;
			display: flex;
			flex-wrap: wrap;
			gap: 10px;
			.el-tag {
				cursor: pointer;
			}
		}
	}
	.table_wrap {
		padding: 10px 32px;
		::v-deep(.danger-row) {
			background-color: #fef0f0;
		}
		::v-deep(.success-row) {
			background-color: #f0f9eb;
		}
		::v-deep(.warning-row) {
			background-color: #fdf6ec;
		}
		::v-deep(.primary-row) {
			background-color: #ecf5ff;
		}
		.stock_link {
			cursor: pointer;
			color: #409EFF;
		}
		.price_box {
			.el-tag {
				vertical-align: bottom;
			}
		}
	}
	.selected_box {
		position: fixed;
		right: 20px;
		bottom: 20px;
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: #fff;
		width: 50px;
		height: 50px;
		border-radius: 50%;
		box-shadow: 1px 1px 12px 5px rgba(0,0,0,.08);
		color: #333;
		cursor: pointer;
		z-index: 99;
	}
	::v-deep(.el-table__header-wrapper .cell .el-checkbox__inner) {
		display: none !important;
	}
	::v-deep(.el-drawer) {
		width: 95vw !important;
		.el-drawer__header {
			flex-wrap: wrap;
		}
	}
</style>