import {formRender} from "./core/form-render";
import {deepExtend, isElement, isFunction} from "./core/util";
import formHandler from "./core/form-handler"

//formCreate全局配置
const createOptions = {
    //插入节点,默认document.body
    el:null,
    //form配置
    form:{
        //是否开启行内表单模式
        inline:false,
        //表单域标签的位置，可选值为 left、right、top
        labelPosition:'right',
        //表单域标签的宽度，所有的 FormItem 都会继承 Form 组件的 label-width 的值
        labelWidth:125,
        //是否显示校验错误信息
        showMessage:true,
        //原生的 autocomplete 属性，可选值为 off 或 on
        autocomplete:'off',
    },
    upload:{
        //上传文件之前的钩子，参数为上传的文件，若返回 false 或者 Promise 则停止上传
        beforeUpload:()=>{},
        //文件上传时的钩子，返回字段为 event, file, fileList
        onProgress:(event, file, fileList)=>{},
        //文件上传成功时的钩子，返回字段为 response, file, fileList,若需有把文件添加到文件列表中,在函数值返回即可
        onSuccess:(response, file, fileList)=>{
            // return filePath;
        },
        //文件上传失败时的钩子，返回字段为 error, file, fileList
        onError:(error, file, fileList)=>{},
        //点击已上传的文件链接时的钩子，返回字段为 file， 可以通过 file.response 拿到服务端返回数据
        onPreview:(file)=>{},
        //文件列表移除文件时的钩子，返回字段为 file, fileList
        onRemove:(file, removeFn)=>{removeFn();},
        //文件格式验证失败时的钩子，返回字段为 file, fileList
        onFormatError:(file, fileList)=>{},
        //文件超出指定大小限制时的钩子，返回字段为 file, fileList
        onExceededSize:(file, fileList)=>{},
        //操作按钮的图标 ,设置为false将不显示
        handleIcon:'ios-eye-outline',
        //点击操作按钮事件
        onHandle:(src)=>{},
        //是否可删除,设置为false是不显示删除按钮
        allowRemove:true
    },
    //表单提交事件
    onSubmit:(formData)=>{},
    //提交按钮配置,设置为false时不显示按钮
    submitBtn:{
        //按钮类型，可选值为primary、ghost、dashed、text、info、success、warning、error或者不设置
        type:"primary",
        //按钮大小，可选值为large、small、default或者不设置
        size:"large",
        //按钮形状，可选值为circle或者不设置
        shape:undefined,
        //开启后，按钮的长度为 100%
        long:true,
        //设置button原生的type，可选值为button、submit、reset
        htmlType:"button",
        //设置按钮为禁用状态
        disabled:false,
        //设置按钮的图标类型
        icon:"ios-upload",
        //按钮文字提示
        innerText:"提交",
        //设置按钮为加载中状态
        loading:false
    }
};

const formCreateComponent = function (rules,options) {
    if(!this instanceof formCreateComponent)
        throwIfMissing('formCreateComponent is a constructor and should be called with the `new` keyword');
    this.rules = Array.isArray(rules) ? rules : [];
    this.handlers = {};
    this.fRender = {};
    this.formData ={};
    this.validate ={};
    options.el = !options.el
        ? window.document.body
        : (isElement(options.el)
                ? options.el
                : document.querySelector(options.el)
        );
    this.options = options;
};

const formCreateName = 'form-create';

const formCreateStyleElId = 'form-create-style';

const formCreateStyle = '.fc-upload .fc-files{display: inline-block;width: 58px;height: 58px;text-align: center;line-height: 60px;border: 1px solid transparent;border-radius: 4px;overflow: hidden;background: #fff;position: relative;box-shadow: 0 1px 1px rgba(0,0,0,.2);margin-right: 4px;box-sizing: border-box;}' +
    ' .fc-files>.ivu-icon{transform: translateY(20%);}'+
    '.fc-upload .fc-files img{width:100%;height:100%;display:block;}' +
    '.fc-upload .ivu-upload{display: inline-block;}' +
    '.fc-upload .ivu-upload .fc-upload-btn{ width: 58px;height: 58px;line-height: 58px;}' +
    '.fc-upload .ivu-upload .fc-upload-btn i{font-size: 20px;}' +
    '.fc-upload .fc-upload-cover{ display: none; position: absolute; top: 0; bottom: 0; left: 0; right: 0; background: rgba(0,0,0,.6); }' +
    '.fc-upload .fc-upload-cover i{ color: #fff; font-size: 20px; cursor: pointer; margin: 0 2px; }' +
    '.fc-upload .fc-files:hover .fc-upload-cover{ display: block; }' +
    '.fc-upload .ivu-upload-list-file{ display: inline-block;float: left; }'+
    '.fc-upload .ivu-upload-list{ position: absolute;left: 0; }'+
    '.fc-upload .ivu-upload-select .fc-upload-btn{ background: #fff;border: 1px dashed #dddee1;border-radius: 4px;text-align: center;cursor: pointer;position: relative;overflow: hidden;transition: border-color .2s ease; }';

/**
 * 加载css
 */
formCreateComponent.createStyle = function () {
    if (document.getElementById(formCreateStyleElId) !== null) return;
    let style = document.createElement('style');
    style.id = formCreateStyleElId;
    style.innerText = formCreateStyle;
    document.getElementsByTagName('head')[0].appendChild(style);
};


formCreateComponent.install = function(Vue,opt = {}){
    formCreateComponent.createStyle();
    let options = deepExtend(deepExtend(Object.create(null),createOptions),opt);
    Vue.prototype.$formCreate = function(rules,opt = {}){
        if(isElement(opt)) opt = {el:opt};
        let fComponent = new formCreateComponent(rules,deepExtend(options,opt)),
            $vm = fComponent.mount(Vue);
        return fComponent.fCreateApi;
    };
};

formCreateComponent.prototype = {
    init(vm){
        this.vm = vm;
        this.rules.filter((rule)=>rule.field !== undefined).map((rule)=> {
            rule.type = rule.type === undefined ? 'input' : rule.type.toLowerCase();
            let handler = formHandler(this.vm,rule,this.options);
            this.handlers[rule.field] = handler;
            this.formData[rule.field] = handler.getParseValue();
            this.validate[rule.field] = handler.getValidate();
        });
        this.fCreateApi = this.api();
    },
    mount(Vue){
        let $fCreate = Vue.extend(this.component()),$vm = new $fCreate().$mount();
        this.options.el.appendChild($vm.$el);
        return $vm;
    },
    component(){
        let fComponent = this;
        return {
            name:formCreateName,
            data:function () {
                return {
                    formData:{},
                    buttonProps:{}
                }
            },
            render:function(){
                return fComponent.fRender.parse();
            },
            created(){
                fComponent.init(this);
                this.$set(this,'formData',fComponent.formData);
                this.$set(this,'buttonProps',fComponent.options.submitBtn);
                fComponent.fRender = new formRender(fComponent);
            },
            methods:{
                changeFormData(field,value){
                    this.$set(this.formData,field,value);
                },
                removeFormData(field){
                    this.$delete(this.formData,field);
                },
                changeButtonProps(props){
                    this.$set(this,'buttonProps',Object.assign(this.buttonProps,props));
                }
            },
            mounted:function(){
                Object.keys(this.formData).map((field)=>{
                    let unWatch = fComponent.vm.$watch(`formData.${field}`,(n,o)=>{
                        if(fComponent.handlers[field] !== undefined)
                            fComponent.handlers[field].changeParseValue(n,false);
                        else
                            unWatch();
                    });
                });
            }
        }
    },
    api(){
        let fComponent = this;
        return {
            formData:()=>{
                let data = {};
                this.fields().map((field)=>{
                    data[field] = this.handlers[field].getValue() || '';
                });
                return data;
            },
            getValue:(field)=>{
                let handler = this.handlers[field];
                if(handler === undefined)
                    console.error(`${field} 字段不存在!`);
                else{
                    return handler.getValue() || '';
                }
            },
            changeField:(field,value)=>{
                let handler = this.handlers[field];
                if(handler === undefined)
                    console.error(`${field} 字段不存在!`);
                else{
                    handler.changeValue(value);
                }
            },
            removeField:(field)=>{
                if(this.handlers[field] === undefined)
                    console.error(`${field} 字段不存在!`);
                else{
                    this.vm.removeFormData(field);
                    delete this.handlers[field];
                    delete this.validate[field];
                    this.fRender.remove(field);
                    delete this.formData[field];
                }
            },
            validate:(successFn,errorFn)=>{
                this.vm.$refs.cForm.validate((valid)=>{
                    valid === true ? (successFn && successFn()) : (errorFn && errorFn());
                });
            },
            validateField:(field,errorFn)=>{
                this.vm.$refs.cForm.validateField(field,errorFn);
            },
            resetFields:()=>{
                this.vm.$refs.cForm.resetFields();
            },
            remove:()=>{
                this.vm.$el.remove();
                this.vm.$destroy();
            },
            fields:()=>this.fields(),
            submit:function(successFn){
                this.validate(()=>{
                   let formData = this.formData();
                   if(isFunction(successFn))
                       successFn(formData);
                   else
                       fComponent.options.onSubmit && fComponent.options.onSubmit(formData);
                });
            },
            submitStatus:(props = {})=>{
                this.vm.changeButtonProps(props);
            }
        }
    },
    fields(){
        return Object.keys(this.formData);
    }
};

export default formCreateComponent;