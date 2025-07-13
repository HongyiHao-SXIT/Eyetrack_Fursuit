<template>
  <div style="text-align: center;">
    <el-dialog
      :visible.sync="ensured"
      :width="this.$device.isDesktop ? '70%':'95%'"
      style="text-align: center;"
    >
      <div
        v-if="cutFinished===false"
        :style="{width: '100%', height: this.$device.isDesktop ? '350px':'500px'}"
      >
        <vueCropper
          ref="cropper"
          :img="imgToCut.img"
          :outputSize="imgToCut.size"
          :outputType="imgToCut.type"
          :fixed="imgToCut.isFixed"
          :fixedNumber="imgToCut.fixedRate"
          :autoCrop="imgToCut.autoCrop"
          :autoCropWidth="imgToCut.autoCropWidth"
          :autoCropHeight="imgToCut.autoCropHeight"
          :centerBox="false"
        ></vueCropper>
      </div>
      <el-button
        v-if="cutFinished===false"
        type="success"
        style="margin: 20px;"
        @click="finishCut"
      >裁剪完成</el-button>
      <el-form v-if="cutFinished===true" ref="user" v-model="form" style="text-align: center;">
        <el-form-item
          label="已背总天数"
          :rules="[
            { required: true, message: '天数不能为空'},
            { type: 'number', message: '天数必须为数字值'}
          ]"
        >
          <el-input v-model.number="form.daynum"></el-input>
        </el-form-item>
        <el-form-item 
          label="今日单词数"
          :rules="[
            { required: true, message: '单词数不能为空'},
            { type: 'number', message: '单词数必须为数字值'}
          ]"
        >
          <el-input v-model.number="form.wordnum"></el-input>
        </el-form-item>
        <el-form-item
          label="打卡日期"
          :rules="[
            { required: true, message: '日期不能为空'},
          ]"
        >
          <el-date-picker
            v-model="form.currentDate"
            type="date"
            placeholder="选择日期"
            format="yyyy 年 MM 月 dd 日"
            value-format="timestamp">
          ></el-date-picker>
        </el-form-item>
        <el-button type="primary" style="margin: 20px;" @click="finishChoose">确认提交</el-button>
      </el-form>
    </el-dialog>
    <el-row type="flex" justify="center" align="center">
      <el-col
        v-if="allDone===false"
        :span="this.$device.isDesktop ? 12 : 22"
        style="text-align: center;"
      >
        <el-upload
          class="upload-demo"
          action
          drag
          :on-change="uploadFileDone"
          :on-remove="handleRemove"
          :on-exceed="handleExceed"
          :file-list="fileList"
          :auto-upload="false"
          :limit="1"
          style="text-align: center; margin-top: 20%;"
        >
          <i v-if="imgUrl===''" class="el-icon-upload"></i>
          <img v-if="imgUrl!==''" :src="imgUrl" width="100%" />
          <div class="el-upload__text">
            将文件拖到此处，或
            <em>点击上传</em>
          </div>
          <div slot="tip" class="el-upload__tip">只能上传jpg/png文件，且不超过5MB</div>
        </el-upload>
        <el-button type="primary" style="margin: 20px;" @click="function(){ensured=true;}">确认上传</el-button>
      </el-col>
      <el-col
        v-if="allDone===true"
        :span="this.$device.isDesktop ? 12 : 22"
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
import { ref, onMounted } from 'vue';
import { VueCropper } from "vue-cropper";
import {
  Upload,
  Button,
  Row,
  Col,
  Dialog,
  Form,
  FormItem,
  Input,
  DatePicker
} from "element-ui";

const disabled = ref(false);
const imgFile = ref(undefined);
const fileList = ref([]);
const imgUrl = ref("");
const ensured = ref(false);
const imgToCut = ref({
  img: "",
  size: 1,
  type: "png",
  isFixed: true,
  fixedRate: [955, 1274],
  autoCrop: true,
  autoCropWidth: 955,
  autoCropHeight: 1274
});
const cutFinished = ref(false);
const allDone = ref(false);
const backgroundUrl = ref("");
const QRCodeUrl = ref("");
const adUrl = ref("");
const finalResultUrl = ref("");
const bgInfo = ref({
  width: 0,
  height: 0
});
const form = ref({
  daynum: 0,
  wordnum: 0,
  currentDate: 1592839849000
});

const handleRemove = (file, fileList) => {
  file = 0;
  fileList.value = fileList;
  disabled.value = false;
  imgFile.value = undefined;
  fileList.value = [];
  imgUrl.value = "";
};

const handleExceed = (files, fileList) => {
  console.log(files, fileList);
  if (files.length === 1 && fileList.length === 1) {
    const file = files[0];
    const fileType = file.type === undefined ? file.raw.type : file.type;
    if (
      fileType !== "image/jpg" &&
      fileType !== "image/png" &&
      fileType !== "image/jpeg"
    ) {
      this.$message({
        message: "只能上传图片！",
        type: "warning",
        center: "true",
        customClass: "message"
      });
      return;
    }
    imgFile.value = files[0];
    fileList.value = Array(files);
    imgUrl.value = URL.createObjectURL(imgFile.value);
    imgToCut.value.img = imgUrl.value;
    return;
  }
  this.$message.warning(
    `当前限制选择 1 个文件，本次选择了 ${
      files.length
    } 个文件，共选择了 ${files.length + fileList.length} 个文件`
  );
};

const uploadFileDone = (file, fileList) => {
  disabled.value = true;
  var sizeIsSatisfy =
    file.size < 10 * 1024 * 1024 || !file.name.includes("|");
  const fileType = file.type === undefined ? file.raw.type : file.type;
  if (
    fileType !== "image/jpg" &&
    fileType !== "image/png" &&
    fileType !== "image/jpeg"
  ) {
    this.$message({
      message: "只能上传图片！",
      type: "warning",
      center: "true",
      customClass: "message"
    });
    disabled.value = false;
    imgFile.value = undefined;
    fileList.value = [];
    imgUrl.value = "";
    return false;
  }
  if (!sizeIsSatisfy) {
    this.$message({
      message: "文件不符合规范！",
      type: "warning",
      center: "true",
      customClass: "message"
    });
    fileList.value.pop();
    disabled.value = false;
    imgFile.value = undefined;
    fileList.value = [];
    imgUrl.value = "";
    return false;
  }
  disabled.value = false;
  imgFile.value = file;
  fileList.value = fileList;
  imgUrl.value = URL.createObjectURL(file.raw);
  imgToCut.value.img = imgUrl.value;
  console.log(imgUrl.value);
  return true;
};

const finishChoose = async () => {
  allDone.value = true;
  ensured.value = false;
  await setTimeout(() => {}, 200);
  toDrawImage();
};

const finishCut = () => {
  cutFinished.value = false;
  bgInfo.value.width = 900;
  bgInfo.value.height = 1200;
  const cropper = ref(null);
  cropper.value.getCropBlob(async data => {
    backgroundUrl.value = URL.createObjectURL(data);
    console.log(data);
    cutFinished.value = true;
    console.log(backgroundUrl.value);
  });
};

const toDrawImage = async () => {
  CanvasRenderingContext2D.prototype.letterSpacingText = function(
    text,
    x,
    y,
    letterSpacing
  ) {
    var context = this;
    var canvas = context.canvas;
    if (!letterSpacing && canvas) {
      letterSpacing = parseFloat(
        window.getComputedStyle(canvas).letterSpacing
      );
    }
    if (!letterSpacing) {
      return this.fillText(text, x, y);
    }
    var arrText = text.split("");
    var align = context.textAlign || "left";
    var originWidth = context.measureText(text).width;
    var actualWidth = originWidth + letterSpacing * (arrText.length - 1);
    if (align == "center") {
      x = x - actualWidth / 2;
    } else if (align == "right") {
      x = x - actualWidth;
    }
    context.textAlign = "left";
    arrText.forEach(function(letter) {
      var letterWidth = context.measureText(letter).width;
      context.fillText(letter, x, y);
      x = x + letterWidth + letterSpacing;
    });
    context.textAlign = align;
  };
  let background = document.getElementById("bg");
  console.log(background);
  let canvas = document.getElementById("res");
  background.width = bgInfo.value.width;
  background.height = bgInfo.value.height;
  console.log(background.width, background.height);
  let bgImage = new Image();
  console.log(document.getElementById("calendar"));
  bgImage.onload = () => {
    canvas
      .getContext("2d")
      .drawImage(bgImage, 0, 0, bgInfo.value.width, bgInfo.value.height);
    canvas
      .getContext("2d")
      .drawImage(document.getElementById("calendar"), 48, 482*2, 18*2, 18*2);
    canvas
      .getContext("2d")
      .drawImage(document.getElementById("icon"), 25*2, 25*2, 33*2, 33*2);
    canvas
      .getContext("2d")
      .drawImage(document.getElementById("QRCode"), 365*2, 496*2, 63*2, 63*2);
    let ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    ctx.font = "32px 微软雅黑";
    ctx.fillStyle = "#fef9f3";
    ctx.letterSpacingText("我在百词斩背单词", 68*2, 48*2, 2);
    ctx.font = "32px Arial";
    let targetTime = new Date(form.value.currentDate);
    console.log(targetTime.toDateString());
    const days = [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday"
    ];
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December"
    ];
    let dateText = "";
    const texts = targetTime.toDateString().split(" ");
    texts.forEach(data => {
      days.forEach(day => {
        if (day.startsWith(data)) {
          dateText = dateText + day + ", ";
        }
      });
      months.forEach(month => {
        if (month.startsWith(data)) {
          dateText = dateText + month + " ";
        }
      });
    });
    dateText = dateText + texts[2].toString();
    console.log(dateText);
    ctx.letterSpacingText(dateText, 50*2, 498*2, 0);
    ctx.font = "70px Bahnschrift";
    ctx.fillText(form.value.wordnum.toString(), 24*2, 538*2, ctx.measureText(form.value.wordnum.toString()).width - 8);
    ctx.fillText(form.value.daynum.toString(), 118*2, 538*2, ctx.measureText(form.value.daynum.toString()).width - 8);
    ctx.font = " 100 24px 微软雅黑";
    ctx.fillStyle = "#DCDCDC";
    ctx.letterSpacingText("今日单词", 24*2, 566*2, 1);
    ctx.letterSpacingText("坚持天数", 118*2, 566*2, 1);
    ctx.font = " 100 18px 微软雅黑";
    ctx.fillStyle = "#FFFFFF";
    ctx.letterSpacingText("扫码下载", 355*2, 572*2, 1);
    ctx.font = " 500 18px 微软雅黑";
    ctx.fillStyle = "#FFFFFF";
    ctx.letterSpacingText("百词斩", 398*2, 572*2, 1);
    finalResultUrl.value = canvas.toDataURL("image/png");
  };
  bgImage.src = backgroundUrl.value;
};

onMounted(() => {
});
</script>

<style lang="less" scoped>
/deep/ .el-upload-list__item-name {
  display: none;
}
/deep/ .el-upload-list .el-upload-list--text {
  display: none;
}
/deep/ .el-upload-list .is-success {
  display: none;
}
.message {
  margin-top: 2.2em;
  font-size: 20px;
  height: 2.5em;
}
</style>