<template>
  <el-row class="search_wrap">
		<el-col :span="20">
			<el-input v-model="isbn" clearable style="width: 100%;" placeholder="请输入isbn编号,多个时请用;分割开"/>
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
			stripe
			border>
			<el-table-column prop="bookName" label="书名" />
			<el-table-column prop="isbn" label="ISBN编号" />
			<el-table-column prop="price" label="价格" />
			<el-table-column prop="stock" label="库存" />
			<el-table-column prop="cover" label="封面">
				<template #default="scope">
					<el-image
						style="width: 100px; height: 100px"
						:src="scope.row.cover"
						fit="contain"
						:preview-src-list="[scope.row.cover]"
						preview-teleported/>
				</template>
			</el-table-column>
			<el-table-column prop="platform" label="平台">
				<template #default="scope">
					{{ platformComp(scope.row.platform) }}
				</template>
			</el-table-column>
		</el-table>
	</el-row>
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
		const bookId = $('.bookname').children()[0].attribs.href.slice(1)
		obj.bookName = $('.bookname').text()
		obj.cover = $('.book_face').children().first().children().first().attr('src')
		// 获取价格
		const { data: priceDetail } = await axios.get(`/youlu/info3/bookBuy.aspx?bookId=${bookId}`)
		obj.price = priceDetail.info ? JSON.parse(priceDetail.info).main.SalePriceVip : '-'
		obj.stock = priceDetail.info ? JSON.parse(priceDetail.info).main.StoreCounts : '-'
	} else {
		obj.bookName = '-'
		obj.price = '-'
		obj.stock = '-'
	}
	tableData.value.push(obj)
}

async function xgySearch() {
	let obj = { isbn: isbn.value, platform: 'x' }
	const { data: res } = await axios.get(`/xiaoguya/mall/api/mall/product/search/searchProduct?current=1&size=20&keyword=${isbn.value}`, {
		headers: {
			'authorization': 'bearer 94c1d7e9-6c2f-49d5-a29a-6997490f5805',
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
				'authorization': 'bearer 94c1d7e9-6c2f-49d5-a29a-6997490f5805',
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
	if (res.data.total && res.data.list[0].isbn === isbn.value) {
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

function onSearch() {
	// 有路网
	ylSearch()
	// 小谷吖
	xgySearch()
	// 星辰
	xcSearch()
}
</script>

<style lang="scss" scoped>
	.search_wrap {
		padding: 20px 32px 10px 32px;
	}
	.table_wrap {
		padding: 10px 32px;
		::v-deep .danger-row {
			background-color: #fef0f0;
		}
		::v-deep .success-row {
			background-color: #f0f9eb;
		}
		::v-deep .warning-row {
			background-color: #fdf6ec;
		}
		::v-deep .primary-row {
			background-color: #ecf5ff;
		}
	}
</style>