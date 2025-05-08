export function ModalCreateUpdate() {
  return (
    <></>
    /* <Modal
           title={editingEquipment ? "Edit Equipment" : "Add Equipment"}
           open={isModalVisible}
           onCancel={() => {
             setIsModalVisible(false);
             form.resetFields();
             setEditingEquipment(null);
           }}
           footer={null}
         >
           <Form
             form={form}
             onFinish={(values) => {
               const data = {
                 ...values,
                 initialOperationsDate:
                   values.initialOperationsDate.format("YYYY-MM-DD"),
               };
               if (editingEquipment) {
                 updateMutation.mutate({ id: editingEquipment.id, data });
               } else {
                 createMutation.mutate(data);
               }
             }}
             layout="vertical"
           >
             <Form.Item
               name="name"
               label="Name"
               rules={[
                 { required: true, message: "Please input the equipment name!" },
               ]}
             >
               <Input />
             </Form.Item>
   
             <Form.Item
               name="manufacturer"
               label="Manufacturer"
               rules={[
                 { required: true, message: "Please input the manufacturer!" },
               ]}
             >
               <Input />
             </Form.Item>
   
             <Form.Item
               name="serialNumber"
               label="Serial Number"
               rules={[
                 { required: true, message: "Please input the serial number!" },
               ]}
             >
               <Input />
             </Form.Item>
   
             <Form.Item
               name="initialOperationsDate"
               label="Initial Operations Date"
               rules={[
                 {
                   required: true,
                   message: "Please select the initial operations date!",
                 },
               ]}
             >
               <DatePicker style={{ width: "100%" }} />
             </Form.Item>
   
             <Form.Item
               name="areaId"
               label="Area"
               rules={[{ required: true, message: "Please select an area!" }]}
             >
               <Select>
                 {areas?.map((area) => (
                   <Select.Option key={area.id} value={area.id}>
                     {area.name}
                   </Select.Option>
                 ))}
               </Select>
             </Form.Item>
   
             <Form.Item>
               <Button type="primary" htmlType="submit">
                 {editingEquipment ? "Update" : "Create"}
               </Button>
             </Form.Item>
           </Form>
         </Modal> */
  );
}
