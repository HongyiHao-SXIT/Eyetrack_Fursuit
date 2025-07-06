<template>
  <div style="text-align: center;">
    <el-dialog
      v-model="ensured"
      :width="isDesktop ? '70%' : '95%'"
      style="text-align: center;"
    >
      <div
        v-if="!cutFinished"
        :style="{ width: '100%', height: isDesktop ? '350px' : '500px' }"
      >
        <vue-cropper
          ref="cropper"
          :src="imgToCut.img"
          :stencil-props="stencilProps"
          :auto-crop="imgToCut.autoCrop"
        />
      </div>
      <el-button
        v-if="!cutFinished"
        type="success"
        style="margin: 20px;"
        @click="finishCut"
      >裁剪完成</el-button>

      <el-form v-if="cutFinished" ref="user" :model="form" style="text-align: center;">
        <el-form-item label="已背总天数">
          <el-input v-model.number="form.daynum" />
        </el-form-item>

        <el-form-item label="今日单词数">
          <el-input v-model.number="form.wordnum" />
        </el-form-item>

        <el-form-item label="打卡日期">
          <el-date-picker
            v-model="form.currentDate"
            type="date"
            placeholder="选择日期"
            format="yyyy 年 MM 月 dd 日"
            value-format="timestamp"
          />
        </el-form-item>

        <el-button type="primary" style="margin: 20px;" @click="finishChoose">
          确认提交
        </el-button>
      </el-form>
    </el-dialog>

    <el-row justify="center" align="middle">
      <el-col
        v-if="!allDone"
        :span="isDesktop ? 12 : 22"
        style="text-align: center;"
      >
        <el-upload
          class="upload-demo"
          drag
          :on-change="uploadFileDone"
          :on-remove="handleRemove"
          :on-exceed="handleExceed"
          :file-list="fileList"
          :auto-upload="false"
          :limit="1"
          style="text-align: center; margin-top: 20%;"
        >
          <template #default>
            <i v-if="imgUrl === ''" class="el-icon-upload"></i>
            <img v-if="imgUrl !== ''" :src="imgUrl" width="100%" />
            <div class="el-upload__text">
              将文件拖到此处，或<em>点击上传</em>
            </div>
          </template>
          <template #tip>
            <div class="el-upload__tip">只能上传jpg/png文件，且不超过5MB</div>
          </template>
        </el-upload>

        <el-button type="primary" style="margin: 20px;" @click="confirmUpload">
          确认上传
        </el-button>
      </el-col>

      <el-col
        v-if="allDone"
        :span="isDesktop ? 12 : 22"
        style="text-align: center; margin-top: 30px;"
      >
        <img src="../assets/QRCode.png" id="QRCode" hidden>
        <img :src="adUrl" id="ad" hidden />
        <img src="../assets/百词斩.png" id="icon" width="20" hidden />
        <img src="../assets/calendar.png" id="calendar" width="20" hidden />
        <img id="bg" :src="backgroundUrl" width="450px" hidden />
        <canvas id="res" :width="bgInfo.width" :height="bgInfo.height" hidden></canvas>
        <img :src="finalResultUrl" width="450px" />
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue';
import { ElMessage } from 'element-plus';
import { Cropper } from 'vue-advanced-cropper';

const disabled = ref(false);
const imgFile = ref();
const fileList = ref([]);
const imgUrl = ref('');
const ensured = ref(false);
const cutFinished = ref(false);
const allDone = ref(false);
const backgroundUrl = ref('');
const finalResultUrl = ref('');

const bgInfo = reactive({ width: 0, height: 0 });

const imgToCut = reactive({
  img: '',
  size: 1,
  type: 'png',
  isFixed: true,
  fixedRate: [955, 1274],
  autoCrop: true,
  autoCropWidth: 955,
  autoCropHeight: 1274
});

const form = reactive({
  daynum: 0,
  wordnum: 0,
  currentDate: Date.now()
});

const cropperRef = ref();

const isDesktop = computed(() => window.innerWidth > 768);

function handleRemove() {
  fileList.value = [];
  disabled.value = false;
  imgFile.value = undefined;
  imgUrl.value = '';
}

function handleExceed(files, oldFileList) {
  if (files.length === 1 && oldFileList.length === 1) {
    const file = files[0];
    const fileType = file.type || file.raw?.type;
    if (!['image/jpg', 'image/png', 'image/jpeg'].includes(fileType)) {
      ElMessage.warning('只能上传图片！');
      return;
    }
    imgFile.value = file;
    fileList.value = [...files];
    imgUrl.value = URL.createObjectURL(file);
    imgToCut.img = imgUrl.value;
    return;
  }
  ElMessage.warning(`当前限制选择 1 个文件，本次选择了 ${files.length} 个文件，共选择了 ${files.length + oldFileList.length} 个文件`);
}

function uploadFileDone(file, newFileList) {
  disabled.value = true;
  const sizeIsSatisfy = file.size < 10 * 1024 * 1024 && !file.name.includes('|');
  const fileType = file.type || file.raw?.type;
  if (!['image/jpg', 'image/png', 'image/jpeg'].includes(fileType)) {
    ElMessage.warning('只能上传图片！');
    resetUpload();
    return false;
  }
  if (!sizeIsSatisfy) {
    ElMessage.warning('文件不符合规范！');
    resetUpload();
    return false;
  }
  disabled.value = false;
  imgFile.value = file;
  fileList.value = newFileList;
  imgUrl.value = URL.createObjectURL(file.raw);
  imgToCut.img = imgUrl.value;
  return true;
}

function resetUpload() {
  disabled.value = false;
  imgFile.value = undefined;
  fileList.value = [];
  imgUrl.value = '';
}

function finishCut() {
  cutFinished.value = false;
  bgInfo.width = 900;
  bgInfo.height = 1200;
  cropperRef.value.getResult().then((result) => {
    backgroundUrl.value = result.canvas.toDataURL();
    cutFinished.value = true;
  });
}

async function finishChoose() {
  allDone.value = true;
  ensured.value = false;
  await new Promise((resolve) => setTimeout(resolve, 200));
  toDrawImage();
}

function toDrawImage() {
  const canvas = document.getElementById('res');
  const bg = document.getElementById('bg');
  const qr = document.getElementById('QRCode');
  const icon = document.getElementById('icon');
  const calendar = document.getElementById('calendar');
  bg.width = bgInfo.width;
  bg.height = bgInfo.height;
  const ctx = canvas.getContext('2d');
  const img = new Image();
  img.onload = () => {
    ctx.drawImage(img, 0, 0, bgInfo.width, bgInfo.height);
    ctx.drawImage(calendar, 96, 964, 36, 36);
    ctx.drawImage(icon, 50, 50, 66, 66);
    ctx.drawImage(qr, 730, 992, 126, 126);
    ctx.fillStyle = '#fef9f3';
    ctx.font = '32px Arial';
    ctx.fillText('我在百词斩背单词', 136, 96);
    const target = new Date(form.currentDate);
    const dateText = target.toDateString();
    ctx.fillText(dateText, 100, 996);
    ctx.font = '70px Bahnschrift';
    ctx.fillText(String(form.wordnum), 48, 1076);
    ctx.fillText(String(form.daynum), 236, 1076);
    finalResultUrl.value = canvas.toDataURL('image/png');
  };
  img.src = backgroundUrl.value;
}
</script>
<style lang="less" scoped>
/* 使用 ::v-deep 替代 /deep/ 是 Vue 3 官方推荐方式 */
::v-deep .el-upload-list__item-name {
  display: none;
}
::v-deep .el-upload-list .el-upload-list--text {
  display: none;
}
::v-deep .el-upload-list .is-success {
  display: none;
}

.message {
  margin-top: 2.2em;
  font-size: 20px;
  height: 2.5em;
}
</style>
