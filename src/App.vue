<template>
	<el-card class="card">
		<el-row class="search_wrap">
			<el-col :span="20">
				<el-input
					v-model="isbn"
					clearable
					style="width: 100%;"
					placeholder="请输入isbn编号,多个时请用;分割开"
					@clear="onClear"
					@keyup.enter="onSearch(true)"
				/>
			</el-col>
			<el-col :span="3" :offset="1">
				<el-button type="primary" @click="onSearch" style="width: 100%;" >查&nbsp;询</el-button>
			</el-col>
		</el-row>
		<el-row class="table_wrap">
			<el-table
				:data="tableData"
				:row-class-name="rowClassName"
				style="width: 100%"
				border
			>
				<el-table-column prop="bookName" label="书名" />
				<el-table-column prop="isbn" label="ISBN编号" />
				<el-table-column prop="price" label="价格" />
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
					</template>
				</el-table-column>
			</el-table>
		</el-row>
	</el-card>
</template>

<script lang="ts" setup>
import axios from 'axios'
import * as cheerio from 'cheerio'

const isbn = ref('')
const tableData = ref([])

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

async function ylSearch() {
	let obj = { isbn: isbn.value, platform: 'y' }
	const { data: html } = await axios.get(`/youlu/search/result3/?isbn=${isbn.value}`)
	const $ = await cheerio.load(html)
	if ($('.bookname').length) {
		let arr = $('.bookname').map(async (m, el) => {
			const bookId = $(el).children().first().attr('href').slice(1)
			// 获取价格
			const { data: priceDetail } = await axios.get(`/youlu/info3/bookBuy.aspx?bookId=${bookId}`)
			obj.price = priceDetail.info ? JSON.parse(priceDetail.info).main.SalePriceVip : '-'
			obj.stock = priceDetail.info ? JSON.parse(priceDetail.info).main.StoreCounts : '-'
			return {
				...obj,
				bookName: $(el).text(),
				cover: $('.book_face').children().first().children().first().attr('src')
			}
		}).get()
		const data = await Promise.all(arr)
		tableData.value = tableData.value.concat(data)
	} else {
		obj.bookName = '-'
		obj.price = '-'
		obj.stock = '-'
		tableData.value.push(obj)
	}
}

async function xgySearch() {
	let obj = { isbn: isbn.value, platform: 'x' }
	const { data: res } = await axios.get(`/xiaoguya/mall/api/mall/product/search/searchProduct?current=1&size=20&keyword=${isbn.value}`, {
		headers: {
			'authorization': 'bearer bfde643a-6232-4e37-b384-b6322629a453',
			'content-type': 'application/json'
		}
	})
	if (res.data.products) {
		const p = res.data.products
		obj.bookName = p[0].name
		obj.cover = p[0].image
		const bookId = p[0].id
		const { data: priceDetail } = await axios.get(`/xiaoguya/mall/api/mall/product/infoById/${bookId}`, {
			headers: {
				'authorization': 'bearer bfde643a-6232-4e37-b384-b6322629a453',
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
	tableData.value.push(obj)
}

async function xcSearch() {
	let obj = { isbn: isbn.value, platform: 'xc' }
	const { data: res } = await axios.get(`xc/xc-app/linkitembook/searchList?pageNum=0&pageSize=10&condition=${isbn.value}&typeId=&typeId2=&isStock=0&isPriceSort=0`)
	if (res.data && res.data.total && res.data.list[0].isbn === isbn.value) {
		const l = res.data.list[0]
		obj.bookName = l.title
		obj.cover = l.image
		const bookId = l.itemId
		const { data: priceDetail } = await axios.get(`xc/xc-app/linkitembook/bookCondition?bookId=${bookId}`)
		let specs = priceDetail.data.sort((a, b) => a.nowPrice - b.nowPrice)
		let hasStockItem = specs.find(f => f.inventory > 0)
		obj.price = hasStockItem ? hasStockItem.nowPrice : '-'
		obj.stock = hasStockItem ? hasStockItem.inventory : '-'
	} else {
		obj.bookName = '-'
		obj.price = '-'
		obj.stock = '-'
	}
	tableData.value.push(obj)
}

async function kfzSearch() {
	let obj = { isbn: isbn.value, platform: 'k' }
	const { data: res } = await axios.get(`searchkfz/pc-gw/search-web/client/pc/product/keyword/list?dataType=0&keyword=${isbn.value}&page=1&size=50&sortType=7&actionPath=sortType&userArea=12001000000`)
	if (res.data.itemResponse.total > 0) {
		const l = res.data.itemResponse.list
		let arr = l.map(m => {
			return {
				...obj,
				...m,
				bookName: m.title,
				price: (m.price + m.postage.shippingList[0].shippingFee).toFixed(2),
				cover: m.imgBigUrl,
				shopName: m.shopName,
				isBought: m.isUserBoughtShop,
				isQuery: false
			}
		})
		tableData.value = tableData.value.concat(arr)
	} else {
		obj.bookName = '-'
		obj.price = '-'
		obj.stock = '-'
		tableData.value.push(obj)
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
	await Promise.all([ylSearch(), xgySearch(), xcSearch()])
	// 孔夫子
	kfzSearch()
}

function onClear() {
	tableData.value = []
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
	}
</style>