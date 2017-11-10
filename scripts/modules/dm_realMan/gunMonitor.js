App.Module.config({
    package: '/dm_realMan',
    moduleName: 'gunMonitor',
    description: '模块功能：枪口监控',
    importList: ['jquery', 'bootstrap','GridTable']
});
App.Module('gunMonitor', function () {
	var data = null;//修改时的data
	var fakeId = null;
    var gunMonitor = {
        Render: function (params) {
        	gunMonitor.queryGunLists(params);
        	if(!$.fn.canUseWebSocket()){
        		gunMonitor.updateTableAtFixedRate(params);
        	}
        },
        
        /**
         * 定时更新表格
         */
        updateTableAtFixedRate:function(params){
      	  var element = $('#gunMonitorTable');
          if (element.length>0) {
              element.stopTimer();
              element.everyTimer('10s', 'getMontitorDataTimmer', function () {
            	   var url = '/gunMonitor/getGunList';
                   $.http.ajax(url, {
                	   'serialNumber':params.serialNumber,
                       "page": 1,
                       "pageSize":100
                   }, function (data) {
                       if (data && data.success) {
                    	    var  list = data.data.list;
						    $('#gunMonitorTable').GridTableUpdateRow(list);
                       }
                   }, function () {
                   });
            	 
              });
          }
        },
        
        formatData:function(dom, value, datas){
        	var val = main.ToFiexValue(value);
        	$(dom).text(val);
            $(dom).attr('title',val);
            return val;
        },
        initGunInfo : function(e){
        	if(!e){
        		return;
        	}
        	var elements = $('#gunInfo label');
        	if(elements && elements.length>0){
        		 $.each(elements, function (index, item) {
                     var tag = $(item).attr('data-init');
                     var val;
                     if( tag != 'cardNumber' ){
                    if(tag == 'chargeType'){
                            if(e[tag] == 2){
                                val = Msg.valut;
                            }else if(e[tag] == 1){
                                val = Msg.dirct;
                            }
                         }
                         else{
                         val = main.ToFiexValue(e[tag]);                    
                         }         
                     }
                     else{
                        val = e[tag];
                     }
                     $(item).html(val);
                 });
        	}
        },
        //初始化数据
        queryGunLists : function(params){
        	var parm = {'serialNumber':params.serialNumber};
        	$('#gunMonitorTable').GridTable({
                url: 'gunMonitor/getGunList',
                clickSelect: true,
                params: parm,
                title: false,
                idProperty: 'fakeId',
                isRecordSelected: false,
                isSearchRecordSelected: false,
                onLoadReady:function(data, btrs, htrs,totalRecords,map){
                	$('#gunMonitorTable .GridTableExpandBody tr[index]:last > td').css('border-bottom','none');
                	if(!$.isEmptyObject(map)){
                		var arr = [];
                		for(var k in map){
                			arr.push(k);
                		}
                		var json = {pileGuns:arr};
                		$.fn.startRegister("ChargeGunWs",json,function(data){
                			var type = data.type;
                			if(type == 2){
                				var map = data.data;
                				for(var k in map){
                					 $('#gunMonitorTable').GridTableUpdateCell({id:k,name:"chargeStatus"},map[k]);
                				}
                			}else if(type == 1 || type == 3){
                				var datas = data.data;
                				if(fakeId){
                					$.each(datas,function(t,e){
                						if(fakeId == e.fakeId){
                							gunMonitor.initGunInfo(e);
                						}
                					});
                				}
                				if(type == 1){
                					$('#gunMonitorTable').GridTableUpdateRow(datas,["chargeStatus",'managerStatus']);
                				}else{
                					$('#gunMonitorTable').GridTableUpdateRow(datas,['managerStatus']);
                				}
                				
                			}
                        });
                		
                		$.fn.startRegister("ChargePileWs",json,function(data){
                				var map = data.data;
                				for(var k in map){
                					 $('#gunMonitorTable').GridTableUpdateCell({id:k,name:"managerStatus"},map[k]);
                				}
                        });
                	}
                },
                pageBar: true,
                max_height: '575',
                colModel: [
                    {
                        display: '枪口编号',
                        name: 'gunNumer',
                        width: 0.08,
                        sortable: false,
                        align: 'center'
                    },
                    {
                        display: '管理状态',
                        name: 'managerStatus',
                        width: 0.1,
                        sortable: false,
                        align: 'center',
                        fnInit:function(dom, value, datas){
                        	$(dom).css('color','#333')
                        	var val = value;
                            if (value == '1') {
                            	val = Msg.modules.dm_realMan.state.normal;
                            } else if (value == '2') {
                            	val = Msg.modules.dm_realMan.state.broken;
                            } else if (value == '3') {
                            	val = Msg.modules.dm_realMan.state.offline;
                            } else if (value == '4') {
                            	val = Msg.modules.dm_realMan.state.offlineUpload;
                           	 	$(dom).css('color','#F8B117');
                            } else if (value == '5') {
                            	val = Msg.modules.dm_realMan.state.support;
                            }
                            $(dom).text(val);
                            $(dom).attr('title',val);
                            return val;
                        }
                    },
                    {
                        display: '充电状态',
                        name: 'chargeStatus',
                        width: 0.1,
                        sortable: false,
                        align: 'center',
                        fnInit:function(dom, value, datas){
                        	$(dom).css('color','#333')
                        	var val = value;
                            if (value == '1') {
                            	val = Msg.modules.dm_realMan.chargeState.expire;
                            } else if (value == '2') {
                            	val = Msg.modules.dm_realMan.chargeState.connect;
                            } else if (value == '3') {
                            	val = Msg.modules.dm_realMan.chargeState.starting;
                            } else if (value == '4') {
                            	val = Msg.modules.dm_realMan.chargeState.charging;
                           	 	$(dom).css('color','#F8B117');
                            } else if (value == '5') {
                            	val = Msg.modules.dm_realMan.chargeState.finish;
                            } else if (value == '6') {
                            	val = Msg.modules.dm_realMan.chargeState.ordered;
                            } else if (value == '7') {
                            	val = Msg.modules.dm_realMan.chargeState.waitingcharge;
                            }
                            $(dom).text(val);
                            $(dom).attr('title',val);
                            return val;
                        }
                    },
                    {
                        display: '输出交流A向电压(V)',
                        name: 'inputAphaseValtage',
                        width: 0.13,
                        sortable: false,
                        align: 'center',
                        fnInit:gunMonitor.formatData
                    },
                    {
                        display: '输出交流B向电压(V)',
                        name: 'inputBphaseValtage',
                        width: 0.13,
                        sortable: false,
                        align: 'center',
                        fnInit:gunMonitor.formatData
                    },
                    {
                        display: '输出交流C向电压(V)',
                        name: 'inputCphaseValtage',
                        width: 0.13,
                        sortable: false,
                        align: 'center',
                        fnInit:gunMonitor.formatData
                    },
                    {
                        display: 'A向电流(A)',
                        name: 'aphaseCurrent',
                        width: 0.08,
                        sortable: true,
                        align: 'center',
                        fnInit:gunMonitor.formatData
                    },
                    {
                        display: 'B向电流(A)',
                        name: 'bphaseCurrent',
                        width: 0.08,
                        sortable: true,
                        align: 'center',
                        fnInit:gunMonitor.formatData
                    },
                    {
                        display: 'C向电流(A)',
                        name: 'cphaseCurrent',
                        width: 0.08,
                        sortable: true,
                        align: 'center',
                        fnInit:gunMonitor.formatData
                    },
                    {
                        display: '枪口温度(℃)',
                        name: 'gunTemperature',
                        width: 0.08,
                        sortable: true,
                        align: 'center',
                        fnInit:gunMonitor.formatData
                    }
                ],
                expand : function(obj, dom, index){
                	dom.loadPage({
        				url: "/modules/dm_realMan/gunInfo.html",
                        scripts: "modules/dm_realMan/gunInfo"
        			}, {
                        'gunNumber':obj.gunNumer,
                        'serialNumber':obj.serialNumber,
                        "initFun":gunMonitor.initGunInfo
                        
                    },function(data){
                    	$('#gunMonitorTable .GridTableExpandBody .intoExpand:last > td').css('border-bottom','1px solid #CCCCCC');
                    	fakeId = obj.fakeId;
        			});
                },
    			fold : function (dom, index) {
                	$('#gunMonitorTable .GridTableExpandBody tr[index]:last > td').css('border-bottom','none');

    				fakeId = null;
    			}
            }); 
        }
    };
    return gunMonitor;
});