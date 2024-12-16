<template>
	<el-card class="card">
		<el-row class="search_wrap" gutter="20">
			<el-col :span="12">
				<el-input
					v-model="isbn"
					clearable
					style="width: 100%;"
					placeholder="请输入isbn编号,多个时请用;分割开"
					@clear="onClear"
					@keyup.enter="onSearch(true)"
				/>
			</el-col>
			<el-col :span="4">
				<el-button type="primary" @click="onSearch" style="width: 100%;" >查&nbsp;询</el-button>
			</el-col>
			<el-col :span="4">
				<el-button type="warning" @click="onResetToken" style="width: 100%;">重置小谷Token</el-button>
			</el-col>
			<el-col :span="4">
				<el-button type="danger" @click="onResetCookie" style="width: 100%;">重置孔夫子Cookie</el-button>
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
						<span v-if="scope.row.platform === 'k' && scope.row.price !== '-'" :class="{ 'stock_link': !scope.row.isQuery }" @click="onQueryKfzStock(scope.row)">
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
						<el-tag v-if="scope.row.platform === 'k' && scope.row.price !== '-'" :type="scope.row.isBought ? 'success' : 'primary'">
							{{ scope.row.shopName }}
						</el-tag>
						<el-tag v-if="scope.row.platform === 'k'" type="danger">
							{{ scope.row.shopAvgShippingTime }}
						</el-tag>
					</template>
				</el-table-column>
			</el-table>

			<el-badge class="selected_box" :value="selected.length" :offset="[-10, 0]" @click="onShowExcel">
				<el-icon size="24"><Document /></el-icon>
			</el-badge>

			<el-drawer v-model="drawerVisible" :show-close="false" @open="onDrawerOpen">
				<template #header="{ close, titleClass }">
					<h4 :class="titleClass">{{ new Date().toLocaleString() }}</h4>
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
					<el-table-column prop="salePrice" label="售价" />
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
							<el-button size="small" :icon="ICONTop" type="primary" @click="scope.row.salePrice += 1, calcTotalPrice()"/>
							<el-button size="small" :icon="ICONBottom" type="danger" @click="scope.row.salePrice -= 1, calcTotalPrice()"/>
							<el-button size="small" :icon="ICONDelete" type="warning" @click="onDel(scope.$index)" />
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
import { Top, Bottom, Delete } from '@element-plus/icons-vue'
import axios from 'axios'
import * as cheerio from 'cheerio'
import { cloneDeep } from 'lodash'
import useClipboard from 'vue-clipboard3'
import { onMounted } from 'vue'
const { toClipboard } = useClipboard()

const table = ref()
const isbn = ref('')
const tableData = ref([])
const token = ref(localStorage.getItem('xgToken') || '94c1d7e9-6c2f-49d5-a29a-6997490f5805')
const cookie = ref(localStorage.getItem('kfzCookie') || '')
const selected = ref([])
const drawerVisible = ref(false)
const totalPrice = ref(0)
const totalDeliver = ref(0)
const ICONTop = Top
const ICONBottom = Bottom
const ICONDelete = Delete

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

async function ylSearch(isbn, isBatch = false) {
	let obj = { isbn, platform: 'y' }
	const { data: html } = await axios.get(`/api/youlu?isbn=${isbn}`)
	const $ = await cheerio.load(html)
	if ($('.bookname').length) {
		let arr = $('.bookname').map(async (m, el) => {
			const bookId = $(el).children().first().attr('href').slice(1)
			obj.originPrice = $(el).next().children().first().children().last().text().slice(1)
			// 获取价格
			const { data: priceDetail } = await axios.get(`/api/youlu/detail?bookId=${bookId}`)
			obj.price = priceDetail.info ? JSON.parse(priceDetail.info).main.SalePriceVip : '-'
			obj.stock = priceDetail.info ? JSON.parse(priceDetail.info).main.StoreCounts : '-'
			return {
				...obj,
				bookName: $(el).text(),
				cover: $('.book_face').children().first().children().first().attr('src')
			}
		}).get()
		const data = await Promise.all(arr)
		if (isBatch) {
			return data
		}
		tableData.value = tableData.value.concat(data)
	} else {
		obj.bookName = '-'
		obj.price = '-'
		obj.stock = '-'
		if (isBatch) {
			return [obj]
		}
		tableData.value.push(obj)
	}
}

async function xgySearch(isbn, isBatch = false) {
	let obj = { isbn, platform: 'x' }
	token.value = localStorage.getItem('xgToken')
	try {
		const { data: res } = await axios.get(`/api/xiaoguya?isbn=${isbn}&token=${token.value}`)
		if (res.data.products) {
			const p = res.data.products
			obj.bookName = p[0].name
			obj.cover = p[0].image
			obj.originPrice = p[0].price
			const bookId = p[0].id
			const { data: priceDetail } = await axios.get(`/api/xiaoguya/detail?bookId=${bookId}&token=${token.value}`, {
				headers: {
					'authorization': `bearer ${token.value}`,
					'content-type': 'application/json'
				}
			})
			let specs = priceDetail.data.specs.sort((a, b) => a.price - b.price)
			let hasStockItem = specs.find(f => f.stock > 0)
			obj.price = hasStockItem ? hasStockItem.price : '-'
			obj.stock = hasStockItem ? hasStockItem.stock : '-'
		} else {
			obj.bookName = '-'
			obj.price = '-'
			obj.stock = '-'
		}
		if (isBatch) {
			return [obj]
		}
		tableData.value.push(obj)
	} catch(err) {
		if (err.status === 401) {
			ElMessage.error('小谷Token已过期，请点击重置小谷Token')
		}
	}
}

async function xcSearch(isbn, isBatch = false) {
	let obj = { isbn, platform: 'xc' }
	const { data: res } = await axios.get(`/api/xc?isbn=${isbn}`)
	if (res.data && res.data.total && res.data.list[0].isbn === isbn) {
		const l = res.data.list[0]
		obj.bookName = l.title
		obj.cover = l.image
		const bookId = l.itemId
		const { data: priceDetail } = await axios.get(`/api/xc/detail?bookId=${bookId}`)
		let specs = priceDetail.data.sort((a, b) => a.nowPrice - b.nowPrice)
		let hasStockItem = specs.find(f => f.inventory > 0)
		obj.price = hasStockItem ? hasStockItem.nowPrice : '-'
		obj.stock = hasStockItem ? hasStockItem.inventory : '-'
		obj.originPrice = hasStockItem ? hasStockItem.integralPrice : '-'
	} else {
		obj.bookName = '-'
		obj.price = '-'
		obj.stock = '-'
	}
	if (isBatch) {
		return [obj]
	}
	tableData.value.push(obj)
}

async function kfzSearch(isbn, isBatch = false) {
	let obj = { isbn, platform: 'k' }
	cookie.value = localStorage.getItem('kfzCookie')
	const { data: res } = await axios.get(`/api/kfz?isbn=${isbn}&cookie=${cookie.value}`)
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
		obj.bookName = '-'
		obj.price = '-'
		obj.stock = '-'
		if (isBatch) {
			return [obj]
		}
		tableData.value.push(obj)
	}
}

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

async function onQueryKfzStock(row) {
	const { shopId, itemId } = row
	const { data: html } = await axios.get(`bookkfz/${shopId}/${itemId}`)
	row.isQuery = true
	const $ = await cheerio.load(html)
	if ($('.count-val').length) {
		row.stock = $('.store-count').text()
	} else {
		row.stock = 1
	}
}

async function onSearch(isReset = false) {
	isReset && (tableData.value = [])
	if (isbn.value.split(';').length > 1) {
		let isbns = [...new Set(isbn.value.split(';'))]
		isbns.forEach(async e => {
			let res = await Promise.all([ylSearch(e, true), xgySearch(e, true), xcSearch(e, true), kfzSearch(e, true)])
			/*** 规则
			 * 1、有小谷优先小谷
			 * 2、没有小谷的话取星辰或有路网价格最低的
			 * 3、再没有的话取孔夫子网的，需满足发货时长小于30小时的且价格最低的
			 * 4、都没有的话随机取第一个
			 */
			const [res1, res2, res3, res4] = res
			const totalRes = res.reduce((curr, next) => {
				return curr.concat(...next)
			}, [])
			const xg = totalRes.find(f => f.platform === 'x' && f.price !== '-')
			const min = totalRes.filter(f => f.price !== '-' && f.platform !== 'k').sort((a, b) => a.price - b.price)[0]
			const kfz = res4.filter(f => f.shopAvgShippingTime).sort((a, b) => (+a.price + +a.shopAvgShippingTime.match(/\d+/g)[0]) - (+b.price + +b.shopAvgShippingTime.match(/\d+/g)[0]))[0]
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
				if (e.price !== '-' && +e.price < 4) {
					e.salePrice = 9
					e.isCalc = true
				} else if (e.price !== '-' && +e.price >= 4) {
					e.salePrice = Math.round(+e.price + 5)
					e.isCalc = true
				}
			})
		})
	} else {
		await Promise.all([xgySearch(isbn.value), xcSearch(isbn.value), ylSearch(isbn.value)])
		// 孔夫子
		kfzSearch(isbn.value)
	}
	
}

function onResetToken() {
	ElMessageBox.prompt('请输入新的Token', '提示', {
    confirmButtonText: 'OK',
    cancelButtonText: 'Cancel'
	})
	.then(({ value }) => {
		localStorage.setItem('xgToken', value)
	})
	.catch(() => {})
}

function onResetCookie() {
	ElMessageBox.prompt('请输入新的Cookie', '提示', {
    confirmButtonText: 'OK',
    cancelButtonText: 'Cancel'
	})
	.then(({ value }) => {
		localStorage.setItem('kfzCookie', value)
	})
	.catch(() => {})
}

function onClear() {
	tableData.value = []
}

function onSelectClick(selection, row) {
	console.log(selection)
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
		if (e.price !== '-' && +e.price < 4) {
			e.salePrice = 9
			e.isCalc = true
		} else if (e.price !== '-' && +e.price >= 4) {
			e.salePrice = Math.round(+e.price + 5)
			e.isCalc = true
		}
	})
}
function onShowExcel() {
	drawerVisible.value = true
}
function calcTotalPrice() {
	totalPrice.value = selected.value.filter(f => f.stock !== '-').reduce((curr, next) => {
		return curr + (next.salePrice || 0)
	}, 0)
}
function calcTotalDeliver() {
	const arr = selected.value.filter(f => f.stock !== '-').map(m => {
		return m.platform !== 'k' ? m.platform : `${m.platform}${m.shopId}`
	})
	totalDeliver.value = new Set(arr).size
}
function onDrawerOpen() {
	calcTotalPrice()
	calcTotalDeliver()
	selected.value.filter(f => f.platform === 'k' && f.price !== '-' && !f.isQuery).forEach(e => {
		onQueryKfzStock(e)
	})
}
function onDel(index) {
	selected.value.splice(index, 1)
	calcTotalPrice()
	calcTotalDeliver()
}
function onReset() {
	selected.value = []
	calcTotalPrice()
	calcTotalDeliver()
}
async function onCopy() {
	let targetData = selected.value.map(m => {
		return {
			bookName: m.bookName.replaceAll('\n', ''),
			isbn: m.isbn,
			salePrice: m.salePrice || '暂缺',
			stock: m.stock || '-',
			platform: m.platform === 'k' ? `${m.platform}【${m.shopName}】` : m.platform
		}
	})
	let str = ''
	targetData.forEach(e => {
		Object.keys(e).forEach(h => {
			str += e[h] + '\t'
		})
		str += '\n'
	})
	await toClipboard(str)
	ElMessage({
		type: "success",
		message: "复制成功",
	})
}
</script>

<style lang="scss" scoped>
	.card {
		::v-deep(.el-card__body) {
			padding: 0;
		}
	}
	.search_wrap {
		padding: 20px 32px 10px 32px;
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
		width: 90vw !important;
	}
</style>